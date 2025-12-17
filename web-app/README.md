# SAP RFC Web Manager

A full-stack web application for managing SAP RFC connections and executing remote function calls, built with Next.js, Prisma, and node-rfc.

## Features

- 🔌 **Connection Management**: Create and manage multiple SAP connections (Client or Pool mode)
- 📞 **RFC Execution**: Call SAP function modules directly from the web interface
- 📊 **Call History**: Track all RFC calls with execution time and status
- 🎨 **Modern UI**: Built with Next.js 15, React 19, and shadcn/ui components
- 💾 **PostgreSQL Storage**: Persistent storage for connections and call logs

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **SAP NW RFC SDK** (installed and configured on your system)
4. **node-rfc** (parent project must be built)

## Installation

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE saprfc;

# Create user (optional)
CREATE USER sapuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE saprfc TO sapuser;

# Exit
\q
```

### 3. Install Dependencies

```bash
cd web-app
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the `web-app` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saprfc?schema=public"

# Optional: Encryption key for sensitive data (32 characters)
# ENCRYPTION_KEY="your-32-character-encryption-key"
```

### 5. Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Optional: Open Prisma Studio to view database
npm run prisma:studio
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
web-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (Backend)
│   │   ├── connections/      # Connection CRUD endpoints
│   │   ├── sap/              # SAP RFC call endpoints
│   │   └── logs/             # Call history endpoints
│   ├── connections/          # Connection management pages
│   ├── call/                 # RFC execution page
│   ├── logs/                 # Call history page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── prisma.ts             # Prisma client singleton
│   ├── sap-client.ts         # SAP connection utilities
│   └── utils.ts              # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example              # Environment variables template
├── .env.local                # Local environment variables (create this)
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

## API Endpoints

### Connections

- `GET /api/connections` - List all connections
- `POST /api/connections` - Create a new connection
- `GET /api/connections/[id]` - Get connection details
- `PUT /api/connections/[id]` - Update a connection
- `DELETE /api/connections/[id]` - Delete a connection

### SAP Operations

- `POST /api/sap/test` - Test a connection
- `POST /api/sap/call` - Execute an RFC call

### Logs

- `GET /api/logs` - Get call history (with pagination and filters)

## Usage

### 1. Create a Connection

1. Navigate to "Connections" from the home page
2. Click "New Connection"
3. Fill in the SAP connection details:
   - **Connection Name**: A friendly name for this connection
   - **Connection Type**: 
     - `CLIENT`: Direct connection (opens/closes for each call)
     - `POOL`: Connection pool (maintains ready connections)
   - **Host**: SAP application server hostname
   - **System Number**: SAP system number (e.g., "00")
   - **Client**: SAP client number (e.g., "100")
   - **User**: SAP username
   - **Password**: SAP password
   - **Language**: SAP language code (default: "EN")
4. If using POOL type, configure:
   - **Pool Min Connections**: Minimum ready connections
   - **Pool Max Connections**: Maximum ready connections
5. Click "Test Connection" to verify
6. Click "Create Connection" to save

### 2. Execute RFC Calls

1. Navigate to "Execute RFC" from the home page
2. Select a connection from the dropdown
3. Enter the function module name (e.g., `STFC_CONNECTION`)
4. Enter parameters as JSON (e.g., `{"REQUTEXT": "Hello SAP"}`)
5. Click "Execute RFC Call"
6. View the results in the right panel

### 3. View Call History

1. Navigate to "Call History" from the home page
2. Filter by connection or status
3. View execution times, results, and errors
4. Use pagination to browse through historical calls

## Common SAP Function Modules

### Test Functions

- **STFC_CONNECTION**: Echo test
  ```json
  {
    "REQUTEXT": "Hello SAP"
  }
  ```

- **RFC_PING**: Simple ping test
  ```json
  {}
  ```

- **RFC_SYSTEM_INFO**: Get SAP system information
  ```json
  {}
  ```

- **RFC_READ_TABLE**: Read table data
  ```json
  {
    "QUERY_TABLE": "T001",
    "DELIMITER": "|",
    "ROWCOUNT": 10
  }
  ```

## Troubleshooting

### node-rfc Not Found

If you get errors about node-rfc not being found:

1. Ensure the parent `node-rfc` project is built:
   ```bash
   cd ..
   npm install
   npm run build
   ```

2. Check that `NODE_RFC_MODULE_PATH` is set correctly in your environment

### Database Connection Errors

- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in `.env.local`
- Ensure the database exists: `psql -l | grep saprfc`

### SAP Connection Errors

- Verify SAP NW RFC SDK is installed
- Check connection parameters (host, port, credentials)
- Ensure network connectivity to SAP system
- Check SAP user permissions

## Development

### Database Management

```bash
# View database in GUI
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npm run prisma:generate
```

### Adding New shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

## Security Considerations

⚠️ **Important**: This application stores SAP credentials in the database. For production use:

1. Encrypt passwords before storing (see `FURTHER_CONSIDERATIONS.md`)
2. Use environment variables for sensitive configuration
3. Implement proper authentication/authorization
4. Use HTTPS in production
5. Restrict database access
6. Consider using SAP SSO or OAuth instead of passwords

## License

This project is part of the node-rfc package and follows the same license.

## Support

For issues related to:
- **node-rfc**: See [parent project](../README.md)
- **SAP NW RFC SDK**: See [SAP documentation](https://support.sap.com/nwrfcsdk)
- **This web app**: Create an issue in the project repository
