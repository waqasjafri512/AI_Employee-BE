# AI Employee - Backend

A powerful NestJS-based backend for an AI-powered WhatsApp automation system. This service handles message analysis, intent detection, automated responses, and human approval workflows.

## 🚀 Features

- **AI-Powered Message Analysis** (Groq Cloud / Grok xAI)
- **Multi-Tenant Architecture** (Business-specific configurations)
- **WhatsApp Cloud API Integration**
- **Automated Response System** with Human Approval Workflows
- **Real-time Dashboard Analytics**
- **CSV Export for Interaction Logs**
- **PostgreSQL Database** with Prisma ORM

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v15 or higher)
- **npm** or **yarn**

---

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <your-backend-repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ai_employee"
   PORT=3000
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # AI Provider (Groq Cloud or Grok xAI)
   GROK_API_KEY=gsk_your_groq_api_key_here
   
   # WhatsApp Cloud API (Optional for testing)
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WEBHOOK_VERIFY_TOKEN=my_secret_token
   ```

4. **Run database migrations**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

   The backend will be available at `http://localhost:3000`

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key` |
| `GROK_API_KEY` | Groq or Grok AI API key | `gsk_...` or `xai-...` |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API token | `EAAxxxx...` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Phone Number ID | `123456789` |
| `WEBHOOK_VERIFY_TOKEN` | Webhook verification token | `my_secret_token` |

---

## 📚 API Endpoints

### Authentication
- `POST /auth/signup` - Register a new business
- `POST /auth/login` - Login and get JWT token

### Dashboard
- `GET /dashboard/stats` - Get business statistics
- `GET /dashboard/engagement` - Get recent interactions
- `GET /dashboard/export` - Export logs as CSV

### WhatsApp
- `POST /whatsapp/webhook` - Receive WhatsApp messages
- `POST /whatsapp/simulate` - Simulate incoming messages (for testing)

### Approvals
- `GET /approvals/pending` - Get pending approval requests
- `PATCH /approvals/:id/status` - Approve/reject a request

---

## 🧪 Testing

Run the simulator endpoint to test AI responses:
```bash
curl -X POST http://localhost:3000/whatsapp/simulate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"923001234567","text":"What properties do you have?"}'
```

---

## 🚢 Deployment

### Using PM2 (Production)
```bash
npm run build
pm2 start dist/main.js --name ai-employee-backend
```

### Using Docker
```bash
docker build -t ai-employee-backend .
docker run -p 3000:3000 --env-file .env ai-employee-backend
```

---

## 📖 Tech Stack

- **NestJS** - Backend framework
- **Prisma** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **OpenAI SDK** - For Groq/Grok AI integration
- **Passport JWT** - Authentication
- **Axios** - HTTP client for WhatsApp API

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📄 License

MIT License
