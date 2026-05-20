{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzc5MTkyODkzLCJleHAiOjE3Nzk3OTc2OTN9.ZlnlLVJIX5VmLoB2Yokh8nchD8_kHE9hXFN8f6V9odM",
        "partner": {
            "id": 3,
            "name": "Partner Lahore",
            "email": "partner@test.com",
            "stripeLinked": false,
            "stripeAccountStatus": "pending",
            "onboardingRequired": true
        }
    }
}

when i hit this api http://localhost:5000/stripe/connect by using above partner token then response is:
{
    "success": true,
    "message": "Stripe account is now active",
    "data": {
        "stripeLinked": true,
        "stripeAccountStatus": "active",
        "onboardingRequired": false
    }
}

// and database automatically update the status from pending to active 
