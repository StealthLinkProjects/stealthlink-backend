# AI-Powered Disposable Communication App Documentation

## Overview

This AI-powered disposable communication app enables users to manage temporary SMS numbers and email addresses efficiently. It leverages GPT-3.5 for handling natural language queries and generating responses. The app allows users to request temporary numbers, generate email addresses, list previously generated numbers and emails, and retrieve messages for those numbers or emails.

The chatbot assistant within the app interprets user input and responds in real-time, enabling seamless interaction with the app's features. It supports features like SMS number generation for services and countries, email creation, and managing user numbers and messages. All interactions are controlled by pre-set intents and rules.

## Features

1. **Temporary SMS Number Generation**:
   - Users can request a temporary SMS number based on service (e.g., Discord, WhatsApp) and country.
   - The system will intelligently match the service and country from the provided list or default to predefined values if missing.

2. **Temporary Email Address Generation**:
   - Users can request a temporary email address without needing additional details.

3. **List Numbers and Emails**:
   - Users can list all their generated SMS numbers and email addresses.
   - The assistant will fetch and display the requested list.

4. **Fetch Messages**:
   - Users can request to see the messages received on any of their generated phone numbers or email addresses.

5. **Natural Language Understanding**:
   - The system processes queries and generates responses using AI, allowing users to interact naturally with the assistant.

## How It Works

The chatbot uses GPT-3.5 to generate responses based on user inputs. It processes various user requests, such as generating temporary phone numbers, fetching messages, and creating email addresses.

### AI Message Handling

The AI assistant follows specific rules to interpret the user’s requests, as shown in the `data` structure provided below. Here's a breakdown of the core components of the assistant's logic.

#### 1. **General Queries**:

For basic inquiries like "What is the weather?" or "Tell me a joke," the assistant directly responds with a plain-text message. This does not involve JSON responses.

#### 2. **Email Address Generation**:

If a user asks for an email address, the assistant responds with a `JSON` object indicating an `email_request`.

```json
{
  "type": "email_request"
}
```

#### 3. **SMS Number Generation**:

When the user requests an SMS number, the assistant tries to extract the country and service from the user's message. If these details are not provided, it asks for them. The assistant then responds with a `JSON` object containing the country and service details.

For example, a user asking for a "Discord number in the USA" will receive:

```json
{
  "type": "sms_request",
  "content": {
    "country": "USA",
    "service": "Discord"
  }
}
```

The system uses the following lists to match countries and services:

- **Countries**: A comprehensive list of countries like India, USA, UK, Australia, etc.
- **Services**: A list of services such as Discord, WhatsApp, Twitter, Facebook, etc.

#### 4. **Listing Numbers and Emails**:

If the user requests a list of numbers or emails, the assistant responds with the `list_numbers` or `list_emails` request type.

```json
{
  "type": "list_numbers"
}
```

or

```json
{
  "type": "list_emails"
}
```

#### 5. **View Messages for a Number or Email**:

When the user asks to view messages for a specific number or email, the assistant determines whether the request refers to a number or an email and fetches the appropriate messages. It can accept either an index (e.g., 1, 2) or a phone number/email address to fetch messages.

```json
{
  "type": "view_messages_intent",
  "index_or_number": "1"
}
```

or

```json
{
  "type": "view_email_intent",
  "index_or_email": "1"
}
```

### Default Behavior and Responses

- **Country and Service Defaults**: If the user doesn't specify a country or service, defaults are used. The default country is **India**, and the default service is **Discord**.

### Country List

The system supports a wide range of countries such as:

- Afghanistan, Albania, Algeria, Argentina, Australia, Bangladesh, Canada, India, USA, United Kingdom, France, Germany, and many others.

### Service List

The app supports a broad range of services including:

- Discord, WhatsApp, Facebook, Instagram, Telegram, Airbnb, PayPal, Netflix, Twitter, Uber, etc.

---

## Workflow

### User Flow Example

1. **Step 1: Request an SMS Number**
   - The user asks: "Can I get an SMS number for WhatsApp in the USA?"
   - The assistant responds with a JSON object containing the requested country and service.

```json
{
  "type": "sms_request",
  "content": {
    "country": "USA",
    "service": "WhatsApp"
  }
}
```

2. **Step 2: Fetch Messages for the Number**
   - The user asks: "Can you show me messages for my WhatsApp number?"
   - The assistant fetches and returns the list of messages for the number.

```json
{
  "type": "view_messages_intent",
  "index_or_number": "1"
}
```

3. **Step 3: Request an Email Address**
   - The user asks: "Create an email address for me."
   - The assistant responds with an `email_request` JSON object.

```json
{
  "type": "email_request"
}
```

4. **Step 4: View Emails**
   - The user asks: "Show me all my emails."
   - The assistant returns a list of emails using the `list_emails` type.

```json
{
  "type": "list_emails"
}
```

---

## Interaction with the API

The app makes several API calls to handle the following:

- **SMS number generation**: The app sends a request to an API that provides temporary phone numbers based on the service and country.
- **Email address generation**: A different API is used to create temporary email addresses.
- **Fetch messages**: The app retrieves messages from the respective service provider based on the number or email.

These actions ensure that users can easily manage temporary communications without revealing their personal data.

---

## Conclusion

This AI-driven disposable communication app offers a seamless experience for managing temporary phone numbers and email addresses. By using GPT-3.5, it responds intelligently to user queries and requests. Whether you need an SMS number for verification, a temporary email for privacy, or want to check your messages, the app provides a comprehensive solution with AI-powered interactions.

