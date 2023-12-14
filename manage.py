from flask import Flask, render_template, request, redirect, jsonify
import stripe

app = Flask(__name__, instance_relative_config=True)

# more secured way to load configs that are sensitive
# https://flask.palletsprojects.com/en/3.0.x/config/#instance-folders
app.config.from_pyfile("testing.py")


@app.route("/")
def home_page():
    return render_template(
        "index.html", stripe_publishable_key=app.config["STRIPE_PUBLISHABLE_KEY"]
    )


@app.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    stripe.api_key = app.config["STRIPE_SECRET_KEY"]
    try:
        checkout_session = stripe.checkout.Session.create(
            customer_creation="always",
            line_items=request.json,
            # Creating custom fields in check out page
            custom_fields=[
                {
                    "key": "class_location",
                    "label": {"type": "custom", "custom": "Class Location"},
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
            # Pass check out session ID to success URL so we can extract information to render as HTML
            success_url=request.host_url + "success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url=request.host_url + "cancel",
        )
    except Exception as e:
        return jsonify(error=str(e)), 403

    return jsonify({"sessionId": checkout_session["id"]})


@app.route("/success")
def success():
    session_id = request.args.get("session_id", default="", type=str)
    session = stripe.checkout.Session.retrieve(session_id)
    customer = stripe.Customer.retrieve(session.customer)
    return render_template("success.html", customer_name=customer.name)


@app.route("/cancel")
def cancelled():
    return render_template("cancel.html")


if __name__ == "__main__":
    app.run(host="localhost", port=5008, debug=True)
