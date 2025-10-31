# Mock Data Backups

This directory contains schema templates and backup mock data for development purposes only.

## Purpose

- **Schema Templates**: Define the expected data structure for all entities
- **Development Mode**: Allows loading sample data for local testing
- **Production Guard**: All files in this directory are blocked in production

## Usage

### Development Mode
In development (`NODE_ENV=development`), you can optionally seed demo data using the `/api/seed-sample` endpoint with admin authentication.

### Production Mode
In production (`NODE_ENV=production`), this directory is completely inaccessible to ensure no test data leakage.

## Schema Templates

Each template file follows this structure:
```json
{
  "schema_version": 1,
  "description": "Entity description",
  "example": {
    "field1": "<type>",
    "field2": "<type>"
  }
}
```

## Security

- Never commit real user data to this directory
- Only schema templates and anonymized examples allowed
- Admin authentication required for seeding
