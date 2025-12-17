# Quick Start Guide

Get the SAP RFC Web Manager up and running in 5 minutes!

## Prerequisites Check

- ✅ Node.js 18+ installed (`node -v`)
- ✅ PostgreSQL installed and running
- ✅ SAP NW RFC SDK installed
- ✅ Parent node-rfc project built

## Quick Setup

### 1. Database Setup (2 minutes)

```bash
# Create database
createdb saprfc

# Or using psql:
psql postgres -c "CREATE DATABASE saprfc;"
```

### 2. Install Dependencies (1 minute)

```bash
cd web-app
npm install
```

### 3. Configure Environment (30 seconds)

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local if needed (default settings work for local PostgreSQL)
```

Default `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saprfc?schema=public"
```

### 4. Initialize Database (1 minute)

```bash
# Generate Prisma Client and run migrations
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start the Application (30 seconds)

```bash
npm run dev
```

🎉 **Done!** Open [http://localhost:3000](http://localhost:3000)

---

## First Steps

### Create Your First Connection

1. Click **"Connections"** on the home page
2. Click **"New Connection"**
3. Fill in SAP connection details:
   ```
   Connection Name: My SAP Dev
   Connection Type: CLIENT
   Host: your-sap-host.com
   System Number: 00
   Client: 100
   User: your-username
   Password: your-password
   Language: EN
   ```
4. Click **"Test Connection"** to verify
5. Click **"Create Connection"**

### Execute Your First RFC Call

1. Click **"Execute RFC"** on the home page
2. Select your connection
3. Try the test function:
   - Function: `STFC_CONNECTION`
   - Parameters: `{"REQUTEXT": "Hello SAP"}`
4. Click **"Execute RFC Call"**
5. View the result! 🎊

---

## Common Issues

### "Database connection failed"

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL if needed
brew services start postgresql@15  # macOS
sudo systemctl start postgresql     # Linux
```

### "node-rfc module not found"

```bash
# Build parent node-rfc project first
cd ..
npm install
npm run build
cd web-app
npm install
```

### "Cannot connect to SAP"

- Verify SAP host is reachable: `ping your-sap-host.com`
- Check SAP credentials are correct
- Ensure SAP user has RFC permissions
- Verify SAP NW RFC SDK is installed

---

## Next Steps

- 📖 Read the full [README.md](README.md) for detailed documentation
- 🔐 Review [FURTHER_CONSIDERATIONS.md](FURTHER_CONSIDERATIONS.md) for security improvements
- 💾 Explore your data with `npm run prisma:studio`
- 📊 Check call history in the "Call History" page

## Useful Commands

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Database GUI
npm run prisma:studio

# View database schema
npx prisma db pull

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

---

**Need Help?** Check the [README.md](README.md) or create an issue on GitHub.
