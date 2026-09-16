import json
import uuid

def generate():
    collection = {
        "info": {
            "_postman_id": "omnibook-service-booking-api-v1",
            "name": "OmniBook Service Booking API",
            "description": "Autonomous end-to-end collection for OmniBook Universal Service Booking Assistant.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {"key": "baseUrl", "value": "http://localhost:8000", "type": "string"},
            {"key": "merchantId", "value": "00000000-0000-0000-0000-000000000001", "type": "string"},
            {"key": "categoryId", "value": "11111111-1111-1111-1111-111111111111", "type": "string"},
            {"key": "serviceId", "value": "22222222-2222-2222-2222-222222222222", "type": "string"},
            {"key": "staffEmail", "value": "staff.specialist@example.com", "type": "string"},
            {"key": "staffPassword", "value": "SpecialistSecurePass123!", "type": "string"},
            {"key": "staffToken", "value": "", "type": "string"},
            {"key": "bookingId", "value": "", "type": "string"},
            {"key": "cancellationVerificationToken", "value": "", "type": "string"}
        ],
        "item": [
            {
                "name": "1. Admin Portal",
                "item": [
                    {
                        "name": "Provision Staff Specialist",
                        "event": [
                            {
                                "listen": "prerequest",
                                "script": {
                                    "exec": [
                                        "// Use a dynamic email per run so unique constraint never conflicts",
                                        "var dynamicEmail = 'specialist_' + Date.now() + '@example.com';",
                                        "pm.variables.set('staffEmail', dynamicEmail);",
                                        "pm.collectionVariables.set('staffEmail', dynamicEmail);"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/admin/staff?merchant_id={{merchantId}}&name=Sarah Jenkins&email={{staffEmail}}&password={{staffPassword}}",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "admin", "staff"],
                                "query": [
                                    {"key": "merchant_id", "value": "{{merchantId}}"},
                                    {"key": "name", "value": "Sarah Jenkins"},
                                    {"key": "email", "value": "{{staffEmail}}"},
                                    {"key": "password", "value": "{{staffPassword}}"}
                                ]
                            }
                        }
                    },
                    {
                        "name": "Get Merchant Agent Config",
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/admin/config/{{merchantId}}",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "admin", "config", "{{merchantId}}"]
                            }
                        }
                    },
                    {
                        "name": "Update Merchant Agent Config",
                        "request": {
                            "method": "PATCH",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "llm_provider": "openai",
                                    "llm_model_id": "gpt-4o",
                                    "api_key": "sk-proj-sample-placeholder",
                                    "system_prompt": "You are a courteous, expert service booking concierge.",
                                    "agent_greeting": "Hello! Welcome to our salon. How may I assist you with your booking today?"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/admin/config/{{merchantId}}",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "admin", "config", "{{merchantId}}"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "2. Customer & Public User",
                "item": [
                    {
                        "name": "List Catalog Categories",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var jsonData = pm.response.json();",
                                        "if (Array.isArray(jsonData) && jsonData.length > 0) {",
                                        "    pm.collectionVariables.set('categoryId', jsonData[0].id);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/catalog?merchant_id={{merchantId}}",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "catalog"],
                                "query": [{"key": "merchant_id", "value": "{{merchantId}}"}]
                            }
                        }
                    },
                    {
                        "name": "List Services in Category",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var jsonData = pm.response.json();",
                                        "if (Array.isArray(jsonData) && jsonData.length > 0) {",
                                        "    pm.collectionVariables.set('serviceId', jsonData[0].id);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "GET",
                            "header": [],
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/catalog/{{categoryId}}/services",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "catalog", "{{categoryId}}", "services"]
                            }
                        }
                    },
                    {
                        "name": "Create Service Booking",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var jsonData = pm.response.json();",
                                        "if (jsonData.booking_id) {",
                                        "    pm.collectionVariables.set('bookingId', jsonData.booking_id);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "merchant_id": "00000000-0000-0000-0000-000000000001",
                                    "service_id": "22222222-2222-2222-2222-222222222222",
                                    "customer_name": "John Doe",
                                    "customer_phone": "+1234567890",
                                    "customer_email": "john.doe@example.com",
                                    "note": "First appointment of the week",
                                    "channel": "web"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/bookings",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "bookings"]
                            }
                        }
                    },
                    {
                        "name": "Status Check (ID & Phone)",
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "booking_id": "{{bookingId}}",
                                    "phone": "+1234567890"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/bookings/status-check",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "bookings", "status-check"]
                            }
                        }
                    },
                    {
                        "name": "Verify Cancellation Eligibility",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var jsonData = pm.response.json();",
                                        "if (jsonData.verification_token) {",
                                        "    pm.collectionVariables.set('cancellationVerificationToken', jsonData.verification_token);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "booking_id": "{{bookingId}}",
                                    "phone_or_name": "+1234567890"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/bookings/verify",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "bookings", "verify"]
                            }
                        }
                    },
                    {
                        "name": "Submit Customer Feedback",
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "merchant_id": "00000000-0000-0000-0000-000000000001",
                                    "booking_id": "{{bookingId}}",
                                    "rating": 5,
                                    "comment": "Seamless booking and dispatch experience!",
                                    "flow_type": "booking"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/feedback",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "feedback"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "3. Staff Portal",
                "item": [
                    {
                        "name": "Staff Login",
                        "event": [
                            {
                                "listen": "test",
                                "script": {
                                    "exec": [
                                        "var jsonData = pm.response.json();",
                                        "if (jsonData.access_token) {",
                                        "    pm.collectionVariables.set('staffToken', jsonData.access_token);",
                                        "}"
                                    ],
                                    "type": "text/javascript"
                                }
                            }
                        ],
                        "request": {
                            "method": "POST",
                            "header": [{"key": "Content-Type", "value": "application/json"}],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "email": "{{staffEmail}}",
                                    "password": "{{staffPassword}}"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/staff/auth/staff/login",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "staff", "auth", "staff", "login"]
                            }
                        }
                    },
                    {
                        "name": "Get Staff Assigned Bookings Queue",
                        "request": {
                            "method": "GET",
                            "header": [{"key": "Authorization", "value": "Bearer {{staffToken}}"}],
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/staff/bookings?status=pending",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "staff", "bookings"],
                                "query": [{"key": "status", "value": "pending"}]
                            }
                        }
                    },
                    {
                        "name": "Staff Decision (Accept / Reject)",
                        "request": {
                            "method": "PATCH",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "Authorization", "value": "Bearer {{staffToken}}"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "action": "accept",
                                    "reason": "Available for customer appointment"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/staff/bookings/{{bookingId}}/decision",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "staff", "bookings", "{{bookingId}}", "decision"]
                            }
                        }
                    },
                    {
                        "name": "Staff Finalize Booking",
                        "request": {
                            "method": "PATCH",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "Authorization", "value": "Bearer {{staffToken}}"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "scheduled_date": "2026-09-20 14:00:00",
                                    "payment_status": "paid",
                                    "notes": "Appointment finalized with customer via phone"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/staff/bookings/{{bookingId}}/finalize",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "staff", "bookings", "{{bookingId}}", "finalize"]
                            }
                        }
                    }
                ]
            },
            {
                "name": "4. Customer Cancellation (Post-Verification)",
                "item": [
                    {
                        "name": "Execute Cancellation (Bearer Token)",
                        "request": {
                            "method": "POST",
                            "header": [
                                {"key": "Content-Type", "value": "application/json"},
                                {"key": "Authorization", "value": "Bearer {{cancellationVerificationToken}}"}
                            ],
                            "body": {
                                "mode": "raw",
                                "raw": json.dumps({
                                    "cancellation_reason": "Schedule conflict"
                                }, indent=2)
                            },
                            "url": {
                                "raw": "{{baseUrl}}/api/v1/user/bookings/{{bookingId}}/cancel",
                                "host": ["{{baseUrl}}"],
                                "path": ["api", "v1", "user", "bookings", "{{bookingId}}", "cancel"]
                            }
                        }
                    }
                ]
            }
        ]
    }

    output_path = "c:/Users/DELL/work/booking agent/OmniBook_API.postman_collection.json"
    with open(output_path, "w") as f:
        json.dump(collection, f, indent=2)
    print("OmniBook_API.postman_collection.json updated successfully!")

    import subprocess
    import shutil
    from pathlib import Path
    target_dir = Path("c:/Users/DELL/work/booking agent/OmniBook Service Booking API")
    if target_dir.exists():
        shutil.rmtree(target_dir)

    result = subprocess.run(["postman", "collection", "migrate", output_path], capture_output=True, text=True, shell=True)
    if result.returncode == 0:
        print("Migrated collection to v3 YAML format successfully!")
    else:
        print(f"Migration warning/error: {result.stderr or result.stdout}")

if __name__ == "__main__":
    generate()

