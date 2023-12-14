function initAddProductButton() {
    $('.btn-product').click(function (e) {
        e.preventDefault();

        var elem = $(this);

        // get priceId - each product and price combination has a unique price id in Stripe
        var priceId = elem.attr('data-price-id');

        // add to localstorage
        var obj = {
            "price": parseInt(elem.attr('data-price')),
            "product_name": elem.attr('data-product-name'),
            "imgSrc": elem.closest('.thumbnail').children('img').attr('src'),
            "qty": 1,
        }
        saveToLocal(priceId, obj);
      
        // Generate html for cart
        var myCart = JSON.parse(localStorage.getItem('cart'));        
        $('.dropdown-cart').html()

        var html = '';

        for (var key in myCart) {
            // add to cart html
            html = html.concat(`
                    <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">                    
                            <img src="${myCart[key]['imgSrc']}" alt="" width="50rem" />
                            <div class="d-flex w-100 justify-content-between">
                                <div class="row">
                                    <span>${myCart[key]['product_name']}</span>
                                    <span>Price: ${myCart[key]['price']}</span>
                                    <span>Quantity: ${myCart[key]['qty']}</span>    
                                </div>                                
                            </div>                        
                    </li>
            `)
        }

        $('.dropdown-cart').html(html);

        // increase counter
        var currentCount = parseInt($('#cart-count').html());
        $('#cart-count').html(currentCount += 1);

    })
}

function saveToLocal(priceId, obj) {
    // https://stackoverflow.com/questions/16083919/push-json-objects-to-array-in-localstorage
    // Parse the serialized data back into an aray of objects
    var cart = JSON.parse(localStorage.getItem('cart'));
    // If price ID not in cart, create the key in the cart object
    // Otherwise increment the quantity by 1
    if (!cart.hasOwnProperty(priceId)) {
        cart[priceId] = obj;
    } else {
        cart[priceId]['qty'] += 1;
    };
    // Re-serialize the array back into a string and store it in localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

function initClearCart() {
    $('#clear-cart').click(function (e) {
        e.preventDefault();
        clearCart();
    })
}

function clearCart() {
    localStorage.setItem('cart', JSON.stringify({}));
    $('#cart-count').html(0);
    $('.dropdown-cart').html();
}

function initMyCheckoutButton() {
    $('#mycheckout').click(function (e) {
        e.preventDefault();
        
        // Get cart data from local storage, then build list required by Stripe Checkout
        var cart = JSON.parse(localStorage.getItem('cart'));
        var cartDataForStripe = []

        for (var key in cart) {
            cartDataForStripe.push(
                {
                    "price": key,
                    "quantity": cart[key]['qty']
                }
            )
        }

        const stripe = Stripe($('#stripeKey').attr("data-key"));

        // POST request to Flask backend that will create the Checkout session
        fetch("/create-checkout-session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(cartDataForStripe)
        })
            .then((response) => { return response.json(); })
            .then((data) => {
                console.log(data);
                // Redirect to Stripe Checkout
                return stripe.redirectToCheckout({ sessionId: data.sessionId })
            })
            .then(function (result) {
                console.log(result);
                if (result.error) {
                    alert(result.error.message);
                }
            });

    })
}

$(document).ready(function () {
    clearCart();
    initAddProductButton();
    initClearCart();
    initMyCheckoutButton();
});
