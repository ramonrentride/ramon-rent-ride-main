import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allowed origins for CORS - production and development
const allowedOrigins = [
  'https://lovable.dev',
  'https://www.lovable.dev',
  'https://preview--wkrdwlnlcjggfdmoojkq.lovable.app',
  'https://wkrdwlnlcjggfdmoojkq.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080'
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Strong password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain a special character' };
  }
  return { valid: true };
}

interface CreateUserRequest {
  action: 'create' | 'delete' | 'update-role' | 'create-initial-admin' | 'set-password' | 'update-profile';
  username?: string;
  password?: string;
  newPassword?: string;
  role?: 'admin' | 'mechanic';
  userId?: string;
  displayName?: string;
  phone?: string;
}

// Generate auto email from username
function generateEmail(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${sanitized}@bikerentramon.local`;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create regular client with user's auth token for permission checks
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
      {
        global: { headers: { Authorization: authHeader || '' } },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const body: CreateUserRequest = await req.json();
    console.log('Request body:', JSON.stringify({ ...body, password: '[REDACTED]' }));

    // Handle create-initial-admin (no auth required, but only works if no admins exist)
    if (body.action === 'create-initial-admin') {
      console.log('Checking if any admins exist...');
      
      // Check if any admin already exists
      const { data: hasAdmin, error: checkError } = await supabaseAdmin.rpc('has_any_admin');
      
      if (checkError) {
        console.error('Error checking for admins:', checkError);
        throw new Error('Failed to check for existing admins');
      }
      
      if (hasAdmin) {
        console.log('Admin already exists, rejecting initial admin creation');
        return new Response(
          JSON.stringify({ error: 'Admin already exists. Use login instead.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!body.username || !body.password) {
        return new Response(
          JSON.stringify({ error: 'Username and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password strength
      const passwordValidation = validatePassword(body.password);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ error: passwordValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const email = generateEmail(body.username);
      console.log('Creating initial admin user:', body.username, '(email:', email, ')');
      
      // Create the user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true, // Auto-confirm email for initial admin
        user_metadata: { display_name: body.username }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        user_id: newUser.user.id,
        display_name: body.username
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Assign admin role
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.user.id,
        role: 'admin'
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        throw roleError;
      }

      console.log('Initial admin created successfully');
      return new Response(
        JSON.stringify({ success: true, userId: newUser.user.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For all other actions, verify the caller is an admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    });

    if (!isAdmin) {
      console.log('User is not admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Only admins can manage users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified:', user.id);

    switch (body.action) {
      case 'create': {
        if (!body.username || !body.password || !body.role) {
          return new Response(
            JSON.stringify({ error: 'Username, password, and role are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate password strength
        const passwordValidation = validatePassword(body.password);
        if (!passwordValidation.valid) {
          return new Response(
            JSON.stringify({ error: passwordValidation.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const email = generateEmail(body.username);
        console.log('Creating user:', body.username, '(email:', email, ') with role:', body.role);

        // Create user with service role
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: body.password,
          email_confirm: true,
          user_metadata: { display_name: body.username }
        });

        if (createError) {
          console.error('Error creating user:', createError);
          throw createError;
        }

        // Create profile
        await supabaseAdmin.from('profiles').insert({
          user_id: newUser.user.id,
          display_name: body.username
        });

        // Assign role
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
          user_id: newUser.user.id,
          role: body.role
        });

        if (roleError) {
          console.error('Error assigning role:', roleError);
          throw roleError;
        }

        console.log('User created successfully:', newUser.user.id);
        return new Response(
          JSON.stringify({ success: true, userId: newUser.user.id }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!body.userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prevent self-deletion
        if (body.userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete yourself' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Deleting user:', body.userId);

        // Delete user (this cascades to profiles and user_roles due to FK)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(body.userId);

        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          throw deleteError;
        }

        console.log('User deleted successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-role': {
        if (!body.userId || !body.role) {
          return new Response(
            JSON.stringify({ error: 'User ID and role are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prevent changing own role
        if (body.userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot change your own role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updating role for user:', body.userId, 'to:', body.role);

        const { error: updateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: body.role })
          .eq('user_id', body.userId);

        if (updateError) {
          console.error('Error updating role:', updateError);
          throw updateError;
        }

        console.log('Role updated successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'set-password': {
        if (!body.userId || !body.newPassword) {
          return new Response(
            JSON.stringify({ error: 'User ID and new password are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate password strength
        const passwordValidation = validatePassword(body.newPassword);
        if (!passwordValidation.valid) {
          return new Response(
            JSON.stringify({ error: passwordValidation.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Setting password for user:', body.userId);

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          body.userId,
          { password: body.newPassword }
        );

        if (updateError) {
          console.error('Error setting password:', updateError);
          throw updateError;
        }

        console.log('Password updated successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-profile': {
        if (!body.userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Updating profile for user:', body.userId);

        const updates: Record<string, string> = {};
        if (body.displayName) updates.display_name = body.displayName;
        if (body.phone !== undefined) updates.phone = body.phone;

        if (Object.keys(updates).length === 0) {
          return new Response(
            JSON.stringify({ error: 'No updates provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('user_id', body.userId);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }

        console.log('Profile updated successfully');
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Error in manage-users function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
