const express = require("express");
const bodyParser = require("body-parser");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");

const app = express();

app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

paypal.configure({
    mode: "sandbox", //sandbox or live
    client_id:
        "AUeunJwrVlZ8rdwD4-uNO5ZLZbe9AMvKlTlZY7_ww1_84w-VNsMkDpuey7TXj0d0v2IixISteuPO1ZNI",
    client_secret:
        "EEWLd9pPJu8aAPcSfOaVYQnawJmpgb7DqiqTUVNO3HcPJpgpgBwfVOb02GVyDczaFoi_VVqTotlrGswL"
});

app.get("/", (req, res) => {
    res.render("index");
});

const url = "http://ec2-52-15-55-149.us-east-2.compute.amazonaws.com:3000";
const localurl = "http://localhost:3000"

app.get("/paypal", (req, res) => {
    console.log("--------------");
    console.log(req.query.fundraiseremail);
    console.log(req.query.price);
    console.log("--------------");
    //price = document.getElementById("price").value;
    //fundraiseremail = document.getElementById("fundraiseremail").value;
    var create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: url + "/success",
            cancel_url: url + "/cancel"
        },
        transactions: [
            {
                item_list: {
                    items: [
                        {
                            name: "item",
                            sku: "item",
                            price: "1.00",
                            currency: "USD",
                            quantity: 1
                        }
                    ]
                },
                amount: {
                    currency: "USD",
                    total: "1.00"
                },
                description: "This is the payment description."
            }
        ]
    };



    paypal.payment.create(create_payment_json, function(error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("Create Payment Response");
            //console.log(payment);
            //links[1].href is where we redirect user for payment in webview
            res.redirect(payment.links[1].href);
        }
    });
});

app.get("/success", (req, res) => {
    console.log("reached /success URI");
    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    var execute_payment_json = {
        payer_id: PayerID,
        transactions: [
            {
                amount: {
                    currency: "USD",
                    total: "1.00"
                }
            }
        ]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function(
        error,
        payment
    ) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));

            //IF WE GET PAYMENT SUCCESS, THEN WE NEED TO DO A PAYOUT
            payout();
            res.render("success");
        }
    });
});

app.get("/cancel", (req, res) => {
    console.log("reached /cancel URI");
    res.render("cancel");
});

app.listen(3000, () => {
    console.log("Server is running");
});

function payout() {
    console.log("reached payout");
    var sender_batch_id = Math.random().toString(36).substring(9);

    var create_payout_json = {
        "sender_batch_header": {
            "sender_batch_id": sender_batch_id,
            "email_subject": "You have a payment"
        },
        "items": [
            {
                "recipient_type": "EMAIL",
                "amount": {
                    "value": 1.00,
                    "currency": "USD"
                },
                "receiver": "jcclark43-buyer2@gmail.com",
                "note": "Thank you.",
                "sender_item_id": "item_1"
            }
        ]
    };
    
    paypal.payout.create(create_payout_json, function (error, payout) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Create Payout Response");
            console.log(payout);
        }
    });
}