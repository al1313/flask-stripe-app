function initAddProductButton() {
    $('.btn-product').click(function (e) {
        e.preventDefault();

        var elem = $(this);

        // get values
        var price = parseInt(elem.attr('data-price'));
        var price_id = elem.attr('data-price-id');
        var product_name = elem.attr('data-product-name');
        var imgSrc = elem.closest('.thumbnail').children('img').attr('src');

        // // add to cart html
        // var html = `
        //     <li>
        //         <span class="item">
        //             <span class="item-left">
        //                 <img src="${imgSrc}" alt="" />
        //                 <span class="item-info">
        //                     <span>${product_name}</span>
        //                     <span>$ ${price}</span>
        //                 </span>
        //             </span>
        //         </span>
        //     </li>
        // `
        // $('.dropdown-cart').prepend(html);

        // add to localstorage
        var obj = {
            "price": price,
            "product_name": product_name,
            "imgSrc": imgSrc,
            "qty": 1,            
        }
        saveToLocal(price_id, obj);

        var my_cart = JSON.parse(localStorage.getItem('cart'));

        $('.dropdown-cart').html()

        var html = '';

        for (var key in my_cart) {
            // add to cart html
            html = html.concat(`
                    <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">                    
                            <img src="${my_cart[key]['imgSrc']}" alt="" width="50rem" />
                            <div class="d-flex w-100 justify-content-between">
                                <div class="row">
                                <span>${my_cart[key]['product_name']}</span>
                                <span>Price: ${my_cart[key]['price']}</span>
                                <span>Quantity: ${my_cart[key]['qty']}</span>    
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

function saveToLocal(price_id, obj) {
    // https://stackoverflow.com/questions/16083919/push-json-objects-to-array-in-localstorage
    // var a = {};
    // Parse the serialized data back into an aray of objects
    var a = JSON.parse(localStorage.getItem('cart'));
    // Push the new data (whether it be an object or anything else) onto the array

    if (!a.hasOwnProperty(price_id)) {
        a[price_id] = obj;
        console.log("create");
    } else {
        a[price_id]['qty'] += 1;
        console.log("add qty");
    };

    console.log(a);

    // Re-serialize the array back into a string and store it in localStorage
    localStorage.setItem('cart', JSON.stringify(a));
}

function initClearCart() {
    $('#clear-cart').click(function (e) {
        e.preventDefault();
        console.log("clearing cart");
        clearCart();

    })
}

function clearCart() {
    localStorage.setItem('cart', JSON.stringify({}));
    $('#cart-count').html(0);
    $('.dropdown-cart').html();
}

function initCheckoutButton() {

    $('#checkout-cart').click(function (e) {
        e.preventDefault();
        //
        var productStr = '';
        var totalAmount = 0;
        // build product string
        var cart = JSON.parse(localStorage.getItem('cart'));
        // build vars for cart modal
        cart.forEach(function (item, index) {
            totalAmount += item.amount;
            productStr += item.product;
            // last one
            if (index !== cart.length - 1) {
                productStr += " and ";
            }
        });
        // open cart modal
        var handler = stripeHandlder(totalAmount, productStr);
        handler.open({
            name: productStr,
            description: productStr,
            amount: totalAmount
        });
    })
}

function stripeHandlder(totalAmount, productStr) {
    var handler = StripeCheckout.configure({
        key: $('#stripeKey').attr("data-key"),
        locale: "auto",
        token: function (token) {

            var data = {
                "email": token.email,
                "stripe_token": token.id,
                "description": productStr,
                "amount": totalAmount
            }

            $.ajax({
                url: "/api/charge",
                method: "POST",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data),
            }).done(function (response) {
                var r = response.response;
                // redirect
                var url = `/confirmation?amount=${(r.amount / 100).toFixed(2)}&id=${r.id}&email=${r.billing_details.name}&product=${r.description}`
                window.location.href = url;
            }).fail(function (response) {
                console.log(response)
            });
        }
    });
    return handler
}



$(document).ready(function () {
    clearCart();
    initAddProductButton();
    initClearCart();
    initCheckoutButton();
});
