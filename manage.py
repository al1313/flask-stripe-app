from flask import Flask, render_template, request, redirect
import stripe

# local files
# from config import stripe_keys
from helpers import success_response, error_response, check_json


app = Flask(__name__, instance_relative_config=True)
app.config.from_pyfile("testing.py")


@app.route("/")
def home_page():
    return render_template(
        "index.html", stripe_publishable_key=app.config["STRIPE_PUBLISHABLE_KEY"]
    )


@app.route("/confirmation")
def confirmation_page():
    id = request.args.get("id", default="", type=str)
    amount = request.args.get("amount", default="", type=str)
    email = request.args.get("email", default="", type=str)
    product = request.args.get("product", default="", type=str)

    return render_template(
        "confirmation.html", id=id, email=email, product=product, amount=amount
    )


@app.route("/api/charge", methods=["POST"])
def charge_api():
    if request.method == "POST":
        # grab json from request body
        json = request.json
        # check if all keys present, return error if any missing
        result = check_json(json, ["email", "stripe_token", "description", "amount"])
        if result:
            return error_response("missing {}".format(result))
        # add stripe api key
        stripe.api_key = app.config["STRIPE_SECRET_KEY"]
        try:
            # create customer ID
            customer = stripe.Customer.create(
                email=json["email"], source=json["stripe_token"]
            )
            # create charge
            charge = stripe.Charge.create(
                customer=customer.id,
                amount=json["amount"],
                currency="usd",
                description=json["description"],
            )
            # jsonify'd 200 success
            return success_response(charge)

        except stripe.error.StripeError as e:
            # jsonify'd 500 error
            return error_response(e)


YOUR_DOMAIN = "http://localhost:5008"


@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    stripe.api_key = app.config["STRIPE_SECRET_KEY"]
    try:
        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    # Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                    "price": "price_1OMfgeJopRORFg9GWw8uMzD5",
                    "quantity": 1,
                },
                {
                    "price": "price_1OMfgDJopRORFg9GNPTxl4DR",
                    "quantity": 1,
                },
            ],
            custom_fields=[
                {
                    "key": "childcare_location",
                    "label": {"type": "custom", "custom": "Centre Location"},
                    "type": "text",
                },
                {
                    "key": "class_time",
                    "label": {"type": "custom", "custom": "Class Time"},
                    "type": "dropdown",
                    "dropdown": {
                        "options": [
                            {"label": "Morning", "value": "morning"},
                            {"label": "Afternoon", "value": "afternoon"},
                        ],
                    },
                },
            ],
            mode="payment",
            success_url=YOUR_DOMAIN + "/success",
            cancel_url=YOUR_DOMAIN + "/cancel",
        )
    except Exception as e:
        return str(e)

    return redirect(checkout_session.url, code=303)


@app.route("/success")
def success():
    return render_template("success.html")


@app.route("/cancel")
def cancelled():
    return render_template("cancel.html")


if __name__ == "__main__":
    app.run(host="localhost", port=5008, debug=True)
