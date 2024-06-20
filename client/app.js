let blikButton = document.getElementById('blik-button');

async function lpm() {
    try {
        const clientTokenResponse = await fetch('./clientToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!clientTokenResponse.ok) {
            throw new Error('Failed to fetch client token');
        }

        const clientToken = await clientTokenResponse.json();

        // Create a client.
        const clientInstance = await new Promise((resolve, reject) => {
            braintree.client.create({
                authorization: clientToken.clientToken
            }, function (clientErr, clientInstance) {
                if (clientErr) {
                    return reject('Error creating client: ' + clientErr);
                }
                resolve(clientInstance);
            });
        });

        console.log(clientInstance);

        // Create a local payment component.
        const localPaymentInstance = await new Promise((resolve, reject) => {
            braintree.localPayment.create({
                client: clientInstance,
                merchantAccountId: merchantAccountId()
            }, function (localPaymentErr, paymentInstance) {
                if (localPaymentErr) {
                    return reject('Error creating local payment: ' + localPaymentErr);
                }
                resolve(paymentInstance);
            });
        });

        console.log(localPaymentInstance);

        return localPaymentInstance;

    } catch (error) {
        console.error(error);
    }
}

function createLocalPaymentClickListener(type, localPaymentInstance) {
    return function (event) {
        event.preventDefault();

        localPaymentInstance.startPayment({
            paymentType: type,
            amount: '10.67',
            fallback: {
                url: 'https://your-domain.com/page-to-complete-checkout',
                buttonText: 'Complete Payment'
            },
            currencyCode: 'PLN',
            givenName: 'Joe',
            surname: 'Doe',
            address: {
                countryCode: 'NL'
            },
            onPaymentStart: function (data, start) {
                // NOTE: It is critical here to store data.paymentId on your server
                // so it can be mapped to a webhook sent by Braintree once the
                // buyer completes their payment. See Start the payment
                // section for details.

                // Call start to initiate the popup
                console.log('paymentId', data.paymentId);
                document.querySelector('.results .paymentId pre').innerHTML = prettyPrintObject(data);
                start();
            }
        }, function (startPaymentError, payload) {
            if (startPaymentError) {
                if (startPaymentError.code === 'LOCAL_PAYMENT_POPUP_CLOSED') {
                    console.error('Customer closed Local Payment popup.');
                } else {
                    console.error('Error!', startPaymentError);
                }
            } else {
                // Send the nonce to your server to create a transaction
                console.log(payload.nonce);
                document.querySelector('.results').classList.remove('hidden');
                console.log('nonce', payload.nonce);
                document.querySelector('.results .nonce pre').innerHTML = prettyPrintObject(payload);
            }
        });
    };
}

lpm().then(localPaymentInstance => {
    blikButton.addEventListener('click', createLocalPaymentClickListener('blik', localPaymentInstance));
});
