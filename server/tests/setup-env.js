const bcrypt = require('bcryptjs');

// Only set if not already defined (CI sets them via workflow env:)
process.env.DATABASE_URL    = process.env.DATABASE_URL    || 'postgresql://sobral:sobral_pass@localhost:5433/sobral_test';
process.env.JWT_SECRET      = process.env.JWT_SECRET      || 'test-jwt-secret-12345';
process.env.ADMIN_EMAIL     = process.env.ADMIN_EMAIL     || 'admin@test.com';
process.env.ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  || 'Test@123';
process.env.NODE_ENV        = process.env.NODE_ENV        || 'test';
process.env.PORT            = process.env.PORT            || '3099';

if (!process.env.ADMIN_PASSWORD_HASH) {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
}
