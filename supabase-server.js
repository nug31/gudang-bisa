import express from "express";
import { config } from "dotenv";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import supabase from "./src/db/supabase.js";

// Load environment variables
config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

// API Routes

// Users
app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, role, department, avatar_url } = req.body;
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: uuidv4(),
          name,
          email,
          password: hashedPassword,
          role: role || "user",
          department,
          avatar_url,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, avatar_url } = req.body;
    
    // Update user
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        email,
        role,
        department,
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete user
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Authentication
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: uuidv4(),
          name,
          email,
          password: hashedPassword,
          role: "user",
          department,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = data[0];
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Categories
app.get("/api/categories", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Create new category
    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          id: uuidv4(),
          name,
          description,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Item Requests
app.get("/api/item-requests", async (req, res) => {
  try {
    const { status, user_id } = req.query;
    
    let query = supabase
      .from("item_requests")
      .select(`
        *,
        user:user_id (id, name, email, department),
        category:category_id (id, name)
      `)
      .order("created_at", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (user_id) {
      query = query.eq("user_id", user_id);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching item requests:", error);
    res.status(500).json({ error: "Failed to fetch item requests" });
  }
});

app.get("/api/item-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from("item_requests")
      .select(`
        *,
        user:user_id (id, name, email, department),
        category:category_id (id, name),
        approver:approved_by (id, name),
        rejecter:rejected_by (id, name)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Item request not found" });
    }
    
    // Get comments for this request
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select(`
        *,
        user:user_id (id, name, avatar_url)
      `)
      .eq("item_request_id", id)
      .order("created_at", { ascending: true });
    
    if (commentsError) throw commentsError;
    
    // Combine request with comments
    const requestWithComments = {
      ...data,
      comments: comments || []
    };
    
    res.json(requestWithComments);
  } catch (error) {
    console.error("Error fetching item request:", error);
    res.status(500).json({ error: "Failed to fetch item request" });
  }
});

app.post("/api/item-requests", async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      priority,
      user_id,
      quantity,
      total_cost
    } = req.body;
    
    // Create new item request
    const { data, error } = await supabase
      .from("item_requests")
      .insert([
        {
          id: uuidv4(),
          title,
          description,
          category_id,
          priority: priority || "medium",
          status: "pending",
          user_id,
          quantity: quantity || 1,
          total_cost,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    
    // Create notification for admins and managers
    const { data: admins, error: adminsError } = await supabase
      .from("users")
      .select("id")
      .in("role", ["admin", "manager"]);
    
    if (adminsError) throw adminsError;
    
    // Get user name
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single();
    
    if (userError) throw userError;
    
    // Create notifications for each admin/manager
    const notifications = admins.map(admin => ({
      id: uuidv4(),
      user_id: admin.id,
      type: "request_submitted",
      message: `New request "${title}" submitted by ${userData.name}`,
      is_read: false,
      created_at: new Date().toISOString(),
      related_item_id: data[0].id
    }));
    
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);
      
      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      }
    }
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating item request:", error);
    res.status(500).json({ error: "Failed to create item request" });
  }
});

app.put("/api/item-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      priority,
      status,
      quantity,
      total_cost,
      approved_by,
      rejected_by,
      rejection_reason
    } = req.body;
    
    // Get the current request to check for status changes
    const { data: currentRequest, error: currentRequestError } = await supabase
      .from("item_requests")
      .select("status, user_id, title")
      .eq("id", id)
      .single();
    
    if (currentRequestError) throw currentRequestError;
    
    const updateData = {
      title,
      description,
      category_id,
      priority,
      status,
      quantity,
      total_cost,
      updated_at: new Date().toISOString()
    };
    
    // Add approval/rejection data if status changed
    if (status === "approved" && currentRequest.status !== "approved") {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = approved_by;
    } else if (status === "rejected" && currentRequest.status !== "rejected") {
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = rejected_by;
      updateData.rejection_reason = rejection_reason;
    } else if (status === "fulfilled" && currentRequest.status !== "fulfilled") {
      updateData.fulfillment_date = new Date().toISOString();
    }
    
    // Update item request
    const { data, error } = await supabase
      .from("item_requests")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) throw error;
    
    // Create notification for status changes
    if (status && status !== currentRequest.status) {
      let notificationType = "";
      let message = "";
      
      if (status === "approved") {
        notificationType = "request_approved";
        message = `Your request "${currentRequest.title}" has been approved`;
      } else if (status === "rejected") {
        notificationType = "request_rejected";
        message = `Your request "${currentRequest.title}" has been rejected`;
      } else if (status === "fulfilled") {
        notificationType = "request_fulfilled";
        message = `Your request "${currentRequest.title}" has been fulfilled`;
      }
      
      if (notificationType) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert([{
            id: uuidv4(),
            user_id: currentRequest.user_id,
            type: notificationType,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            related_item_id: id
          }]);
        
        if (notificationError) {
          console.error("Error creating notification:", notificationError);
        }
      }
    }
    
    res.json(data[0]);
  } catch (error) {
    console.error("Error updating item request:", error);
    res.status(500).json({ error: "Failed to update item request" });
  }
});

app.delete("/api/item-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete item request
    const { error } = await supabase
      .from("item_requests")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting item request:", error);
    res.status(500).json({ error: "Failed to delete item request" });
  }
});

// Comments
app.post("/api/comments", async (req, res) => {
  try {
    const { item_request_id, user_id, content } = req.body;
    
    // Create new comment
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          id: uuidv4(),
          item_request_id,
          user_id,
          content,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    
    // Get the request and user info
    const { data: request, error: requestError } = await supabase
      .from("item_requests")
      .select("user_id, title")
      .eq("id", item_request_id)
      .single();
    
    if (requestError) throw requestError;
    
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", user_id)
      .single();
    
    if (userError) throw userError;
    
    // Create notification for the request owner (if not the commenter)
    if (request.user_id !== user_id) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([{
          id: uuidv4(),
          user_id: request.user_id,
          type: "comment_added",
          message: `${userData.name} commented on your request "${request.title}"`,
          is_read: false,
          created_at: new Date().toISOString(),
          related_item_id: item_request_id
        }]);
      
      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }
    }
    
    // Get user info for the response
    const { data: commentWithUser, error: commentError } = await supabase
      .from("comments")
      .select(`
        *,
        user:user_id (id, name, avatar_url)
      `)
      .eq("id", data[0].id)
      .single();
    
    if (commentError) throw commentError;
    
    res.status(201).json(commentWithUser);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Notifications
app.get("/api/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;
    
    // Update notification
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read })
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

app.put("/api/notifications/mark-all-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mark all notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Serve React app for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using Supabase at ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
});
