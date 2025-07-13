# MyPnL Admin Panel Setup

This guide will help you set up and use the secure admin panel for your MyPnL SaaS product.

## Features

- 🔐 **Secure Access**: Only allows access to `sarfarazalam.sa460@gmail.com`
- 👥 **User Management**: View all users with their subscription details
- 🔍 **Search & Filter**: Search users by email or name
- 📊 **Plan Management**: Assign Free, Monthly, Yearly, or Lifetime plans
- 📱 **Responsive Design**: Works on mobile and desktop
- 🎨 **Clean UI**: Modern interface with cards and tables

## Setup Instructions

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/mdxskctiwpiwlzkdihdp
2. Navigate to **Settings** → **API**
3. Copy the **"service_role"** key (not the anon key)
4. Create a `.env` file in your project root and add:

```bash
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**⚠️ Important**: Never commit your service role key to version control. Add `.env` to your `.gitignore` file.

### Step 2: Access the Admin Panel

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin panel:
   ```
   http://localhost:8080/admin
   ```

3. Log in with your admin account (`sarfarazalam.sa460@gmail.com`)

## Usage

### Viewing Users

- The admin panel automatically loads all users from your Supabase database
- Each user shows:
  - Email address
  - Full name (if provided)
  - Current plan (Free, Monthly, Yearly, Lifetime)
  - Subscription status
  - Expiry date
  - Join date

### Searching Users

- Use the search bar to filter users by email or name
- The search is case-insensitive and updates in real-time

### Managing User Plans

1. Find the user you want to update
2. Click the dropdown in the "Actions" column
3. Select the new plan:
   - **Free**: No expiry date, limited features
   - **Monthly**: Expires in 1 month
   - **Yearly**: Expires in 1 year
   - **Lifetime**: Never expires, full access

4. The change is applied immediately to the database

### Statistics Dashboard

The admin panel shows key metrics:
- **Total Users**: All registered users
- **Lifetime Users**: Users with lifetime access
- **Paid Users**: Users with monthly, yearly, or lifetime plans
- **Free Users**: Users on the free plan

## Security Features

### Access Control

- Only users with email `sarfarazalam.sa460@gmail.com` can access the admin panel
- All other users will see an "Access Denied" message
- The panel checks authentication on every page load

### Data Protection

- Uses Supabase Row Level Security (RLS) policies
- Service role key is required for admin operations
- All database operations are logged and secured

## Troubleshooting

### "Service Role Key Required" Error

If you see this error:
1. Make sure you've created a `.env` file
2. Verify the service role key is correct
3. Restart your development server after adding the environment variable

### "Access Denied" Error

If you can't access the admin panel:
1. Make sure you're logged in with `sarfarazalam.sa460@gmail.com`
2. Check that you're using the correct email address
3. Try logging out and logging back in

### "Failed to fetch users" Error

If the user list doesn't load:
1. Check your internet connection
2. Verify your Supabase project is active
3. Ensure the service role key has the correct permissions

### No Users Showing

If no users appear:
1. Check if users have actually signed up in your app
2. Verify the database migrations have been applied
3. Check the browser console for any errors

## Database Schema

The admin panel works with these tables:

### `auth.users` (Supabase Auth)
- `id`: User UUID
- `email`: User email address
- `user_metadata`: Contains full_name
- `created_at`: Account creation date

### `public.subscriptions`
- `user_id`: References auth.users.id
- `plan_type`: 'free', 'monthly', 'yearly', 'lifetime'
- `status`: 'active', 'cancelled', 'expired'
- `end_date`: Expiry date (null for free/lifetime)
- `created_at`, `updated_at`: Timestamps

## Environment Variables

Required environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://mdxskctiwpiwlzkdihdp.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Admin Panel (Required)
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Production Deployment

For production deployment:

1. Set the environment variables in your hosting platform (Vercel, Netlify, etc.)
2. Ensure the service role key is kept secure
3. Consider implementing additional security measures like IP whitelisting
4. Monitor admin panel usage through Supabase logs

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all database migrations are applied
4. Test with a fresh browser session

The admin panel is designed to be secure and user-friendly while providing powerful user management capabilities for your MyPnL SaaS product. 