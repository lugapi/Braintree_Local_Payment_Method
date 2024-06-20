document.getElementById('formBlik').addEventListener('submit', async function (e) {
    e.preventDefault(); // Empêcher la soumission par défaut du formulaire

    const number1 = document.getElementById('number1').value;
    const number2 = document.getElementById('number2').value;
    const number3 = document.getElementById('number3').value;
    const number4 = document.getElementById('number4').value;
    const number5 = document.getElementById('number5').value;
    const number6 = document.getElementById('number6').value;

    const code = "" + number1 + number2 + number3 + number4 + number5 + number6;

    console.log(code);

    try {
        const localPaymentInstance = await lpm();
        createLocalPaymentClickListenerNoRedirection('blik', localPaymentInstance, code)();
    } catch (error) {
        console.error('Error:', error);
    }
});

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

        return localPaymentInstance;

    } catch (error) {
        console.error(error);
        throw error; // Propagate the error for further handling
    }
}

function createLocalPaymentClickListenerNoRedirection(type, localPaymentInstance, authCode) {
    return function (event) {
        // event.preventDefault(); // Empêcher la soumission par défaut de l'événement

        localPaymentInstance.startPayment({
            paymentType: type,
            amount: '10.00',
            currencyCode: 'PLN',
            shippingAddressRequired: true,
            email: 'joe@getbraintree.com',
            phone: '487238725269',
            givenName: 'Joe',
            surname: 'Doe',
            address: {
                streetAddress: 'Mokotowska 34',
                extendedAddress: 'Zlota Jesien 64',
                locality: 'Warsaw',
                postalCode: '02-697',
                countryCode: 'PL'
            },
            blikOptions: {
                level_0: {
                    authCode: authCode
                }
            },
            onPaymentStart: function (data) {
                // NOTE: Il est crucial ici de stocker data.paymentId sur votre serveur
                //       pour qu'il puisse être associé à un webhook envoyé par Braintree une fois que
                //       l'acheteur a terminé son paiement. Voir la section "Démarrer le paiement"
                //       pour plus de détails.
                console.log(data);
                document.getElementById('paymentResponse').innerHTML = prettyPrintObject(data);
            }
        }, function (startPaymentError) {
            if (startPaymentError) {
                if (startPaymentError.code === 'LOCAL_PAYMENT_POPUP_CLOSED') {
                    console.error('Le client a fermé la popup de paiement local.');
                } else {
                    console.error('Erreur!', startPaymentError);
                }
            } else {
                // Succès ! Répondez en conséquence ici.
                console.log('Paiement réussi');
            }
        });
    };
}