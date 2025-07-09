# HRM Backend Server

A complete Node.js/Express backend with PostgreSQL database for the HRM system.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: Full CRUD operations for users with role-based access
- **Database**: PostgreSQL with proper indexing and constraints
- **Security**: Helmet, CORS, rate limiting, and input validation
- **API Documentation**: RESTful API with proper error handling

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Setup PostgreSQL Database

Make sure PostgreSQL is installed and running on your system.

Create a database and user:
```sql
CREATE DATABASE hrm_database;
CREATE USER hrm_user WITH PASSWORD 'hrm_password';
GRANT ALL PRIVILEGES ON DATABASE hrm_database TO hrm_user;
```

### 3. Configure Environment
Copy `.env.example` to `.env` and update the database credentials:
```bash
cp .env.example .env
```

### 4. Setup Database Schema
```bash
npm run db:setup
```

This will create the necessary tables and insert a default admin user:
- Username: `admin`
- Password: `admin`

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin/HR only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Health Check
- `GET /health` - Server health status

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  avatar TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'HR', 'Guest')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  department VARCHAR(100),
  organization VARCHAR(100),
  linked_employee VARCHAR(255),
  last_login TIMESTAMP,
  created_date TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMP NOT NULL DEFAULT NOW(),
  permissions JSONB DEFAULT '[]'::jsonb,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  guest_id VARCHAR(50),
  section_access JSONB DEFAULT '[]'::jsonb,
  allowed_sections JSONB DEFAULT '[]'::jsonb
);
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: Prevents SQL injection and XSS

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | hrm_database |
| `DB_USER` | Database user | hrm_user |
| `DB_PASSWORD` | Database password | hrm_password |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | Token expiration | 24h |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8080 |

## Deployment

### Production Setup

1. Set up PostgreSQL database on your server
2. Update environment variables for production
3. Build the application: `npm run build`
4. Start with PM2 or similar process manager
5. Set up reverse proxy (nginx) if needed

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database and user exist

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure CORS is configured correctly

### Performance Issues
- Check database indexes
- Monitor connection pool usage
- Review rate limiting settings