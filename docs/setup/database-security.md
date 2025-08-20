# Database Security Guide

## ✅ Security Checklist

### Environment Variables
- [ ] `DATABASE_URL` is in `.env.local` and never committed to git
- [ ] Database credentials use strong passwords (16+ characters)
- [ ] Production database URL uses SSL connection
- [ ] Environment variables are validated at startup

### Database Configuration
- [x] SSL enforced in production environments
- [x] Connection pooling configured with limits
- [x] Connection timeouts set appropriately
- [x] Strict mode enabled for migrations

### Access Control
- [ ] Database user has minimal required permissions
- [ ] Separate read-only user for analytics (if needed)
- [ ] Database firewall rules restrict access to known IPs
- [ ] Regular password rotation schedule

### Data Privacy
- [x] Contact form data includes privacy agreement tracking
- [x] IP addresses and user agents logged for security
- [x] File access controlled by `isPublic` flag
- [x] Cascade deletion for data integrity

## 🔒 Recommended Database Setup

### PostgreSQL User Permissions
```sql
-- Create application user with minimal permissions
CREATE USER bright_designs_app WITH PASSWORD 'your_secure_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE bright_designs TO bright_designs_app;
GRANT USAGE ON SCHEMA public TO bright_designs_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bright_designs_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO bright_designs_app;
```

### Required Environment Variables
```bash
# Database connection
DATABASE_URL=postgresql://bright_designs_app:password@host:5432/bright_designs?sslmode=require

# Supabase (for authentication & file storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🛡️ Security Best Practices

### 1. Regular Backups
- Daily automated backups
- Test backup restoration process
- Store backups in separate secure location

### 2. Monitoring
- Monitor failed login attempts
- Track unusual query patterns
- Set up alerts for schema changes

### 3. Data Retention
- Regular cleanup of old contact submissions
- Archive old show data appropriately
- GDPR compliance for EU users

### 4. Schema Security
- Never expose internal IDs in URLs
- Use UUIDs for public-facing identifiers
- Implement proper data validation

## 🚨 Security Incidents

### If Credentials Are Compromised:
1. Immediately rotate database password
2. Update environment variables in all environments
3. Review access logs for unauthorized activity
4. Notify users if personal data may be affected

### Regular Security Tasks:
- [ ] Monthly password rotation
- [ ] Quarterly security audit
- [ ] Annual penetration testing
- [ ] Review and update this document

## 📞 Emergency Contacts
- Database Administrator: [Your contact]
- Security Team: [Your contact]
- Hosting Provider Support: [Provider contact]
