import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Addon {
  name: string
  price: number
}

interface CartItem {
  menu_item_id: number
  quantity: number
  addons: Addon[]
}

interface ReqBody {
  p_customer_name: string
  p_phone: string
  p_email: string | null
  p_address: string
  p_lat: number | null
  p_lng: number | null
  p_notes: string | null
  p_payment_method: string
  p_items: CartItem[]
  p_delivery_charge: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const body: ReqBody = await req.json()

    // Validate required fields
    if (!body.p_customer_name || !body.p_phone || !body.p_address) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }
    if (!body.p_items || body.p_items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all menu items referenced in the cart
    const itemIds = body.p_items.map(i => i.menu_item_id)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', itemIds)

    if (menuError) throw menuError
    if (!menuItems || menuItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid menu items found' }), { status: 400, headers: corsHeaders })
    }

    const menuMap = new Map(menuItems.map(m => [m.id, m]))

    // Validate items and calculate server-side total
    let subtotal = 0
    const orderItems: Array<{
      menu_item_id: number
      menu_item_name: string
      quantity: number
      unit_price: number
      total_price: number
      addons: Addon[]
    }> = []

    for (const item of body.p_items) {
      const menuItem = menuMap.get(item.menu_item_id)
      if (!menuItem) {
        return new Response(JSON.stringify({ error: `Menu item ${item.menu_item_id} not found` }), { status: 400, headers: corsHeaders })
      }
      if (!menuItem.is_available) {
        return new Response(JSON.stringify({ error: `${menuItem.name} is not available` }), { status: 400, headers: corsHeaders })
      }

      // Validate addon prices (trust the DB, not the client)
      let addonTotal = 0
      const validAddons: Addon[] = []
      if (item.addons && item.addons.length > 0) {
        const addonNames = item.addons.map(a => a.name)
        const { data: dbAddons, error: addonError } = await supabase
          .from('addons')
          .select('name, price')
          .in('name', addonNames)
          .eq('is_available', true)

        if (addonError) throw addonError

        const addonMap = new Map((dbAddons || []).map(a => [a.name, a]))
        for (const a of item.addons) {
          const dbAddon = addonMap.get(a.name)
          if (dbAddon) {
            validAddons.push({ name: dbAddon.name, price: dbAddon.price })
            addonTotal += dbAddon.price
          }
          // If addon not in DB, skip it silently (client sent a bogus addon)
        }
      }

      const unitPrice = menuItem.price + addonTotal
      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal

      orderItems.push({
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
        addons: validAddons
      })
    }

    // Free delivery over Rs. 1000
    const deliveryCharge = subtotal > 1000 ? 0 : body.p_delivery_charge

    // Generate order number
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const randomId = crypto.randomUUID().slice(0, 6).toUpperCase()
    const orderNumber = `BB${dateStr}-${randomId}`

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.p_customer_name,
        phone: body.p_phone,
        email: body.p_email || null,
        address: body.p_address,
        lat: body.p_lat || null,
        lng: body.p_lng || null,
        notes: body.p_notes || null,
        payment_method: body.p_payment_method,
        subtotal,
        delivery_charge: deliveryCharge,
        total: subtotal + deliveryCharge,
        status: 'placed',
        payment_status: body.p_payment_method === 'cod' ? 'pending' : 'pending'
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Insert order items
    for (const oi of orderItems) {
      const { data: orderItem, error: oiError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          menu_item_id: oi.menu_item_id,
          menu_item_name: oi.menu_item_name,
          quantity: oi.quantity,
          unit_price: oi.unit_price,
          total_price: oi.total_price
        })
        .select('id')
        .single()

      if (oiError) throw oiError

      // Insert addons for this item
      if (oi.addons.length > 0) {
        const { error: addonError } = await supabase
          .from('order_item_addons')
          .insert(
            oi.addons.map(a => ({
              order_item_id: orderItem.id,
              addon_name: a.name,
              addon_price: a.price
            }))
          )

        if (addonError) throw addonError
      }
    }

    return new Response(
      JSON.stringify({
        order_number: orderNumber,
        subtotal,
        delivery_charge: deliveryCharge,
        total: subtotal + deliveryCharge
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('submit-order error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
