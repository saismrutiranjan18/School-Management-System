const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null; // singleton — import this anywhere in the app

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(
        Boolean,
      ),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── JWT Auth Middleware for Socket ─────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: no token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, email, role }
      next();
    } catch (err) {
      return next(new Error("Authentication error: invalid token"));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { id, role, email } = socket.user;
    console.log(`🔌 Socket connected: ${email} [${role}] — ${socket.id}`);

    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
    socket.join("role:all");

    socket.emit("connected", {
      message: `Connected as ${role}`,
      rooms: [`user:${id}`, `role:${role}`, "role:all"],
    });

    // Allow client to join a specific conversation room for typing indicator
    socket.on("join_conversation", ({ other_user_id }) => {
      const roomName = [socket.user.id, other_user_id].sort().join("_");
      socket.join(`conv:${roomName}`);
    });

    socket.on("leave_conversation", ({ other_user_id }) => {
      const roomName = [socket.user.id, other_user_id].sort().join("_");
      socket.leave(`conv:${roomName}`);
    });

    // Typing indicator
    socket.on("typing", ({ to_user_id }) => {
      socket.to(`user:${to_user_id}`).emit("user_typing", {
        from_user_id: socket.user.id,
        from_name: socket.user.email,
      });
    });

    socket.on("stop_typing", ({ to_user_id }) => {
      socket.to(`user:${to_user_id}`).emit("user_stop_typing", {
        from_user_id: socket.user.id,
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${email} [${role}]`);
    });
  });
  return io;
};

// Call this anywhere in controllers to emit events
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };
