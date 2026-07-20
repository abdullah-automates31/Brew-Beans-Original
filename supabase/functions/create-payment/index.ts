import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReqBody {
  order_number: string
  payment_method: string
  amount: number
  return_url: string
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

    if (!body.order_number || !body.payment_method || !body.amount || !body.return_url) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders })
    }

    if (body.payment_method === 'jazzcash') {
      return new Response(
        JSON.stringify({
          configured: true,
          gatewayUrl: 'https://sandbox.jazzcash.com.pk/CustomerPortal/TransactionManagement/Index',
          fields: {
            pp_Version: '2.0',
            pp_TxnType: 'MWALLET',
            pp_Language: 'EN',
            pp_MerchantID: Deno.env.get('JAZZCASH_MERCHANT_ID') || '',
            pp_Password: Deno.env.get('JAZZCASH_PASSWORD') || '',
            pp_TxnRefNo: body.order_number,
            pp_Amount: (body.amount * 100).toFixed(0),
            pp_TxnCurrency: 'PKR',
            pp_TxnDateTime: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
            pp_BillReference: body.order_number,
            pp_Description: `Brew Beans order ${body.order_number}`,
            pp_ReturnURL: body.return_url,
            ppmpf_1: '1',
            ppmpf_2: '2',
            ppmpf_3: '3',
            ppmpf_4: '4',
            ppmpf_5: '5'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.payment_method === 'easypaisa') {
      return new Response(
        JSON.stringify({
          configured: true,
          gatewayUrl: 'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
          fields: {
            storeId: Deno.env.get('EASYPAISA_STORE_ID') || '',
            orderId: body.order_number,
            amount: body.amount.toFixed(0),
            returnUrl: body.return_url,
            transactionType: 'EAASYPAY'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ configured: false, message: 'Unsupported payment method' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-payment error:', err)
    return new Response(
      JSON.stringify({ configured: false, error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
