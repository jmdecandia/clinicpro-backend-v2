/**
 * ClinicPro Backend - V1 Mínima Funcional
 * Endpoints: login, profile, clinic, dashboard
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'clinicpro-secret-key-2024';

// CORS - Permitir cualquier origen para desarrollo
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ==================== BASE DE DATOS EN MEMORIA ====================

const db = {
  clinics: [
    {
      id: 'clinic-001',
      name: 'Clínica Demo',
      slug: 'clinica-demo',
      description: 'Clínica de demostración',
      email: 'demo@clinicpro.com',
      phone: '+34 600 000 000',
      address: 'Calle Principal 123',
      city: 'Madrid',
      country: 'ES',
      logoUrl: null,
      primaryColor: '#0ea5e9',
      secondaryColor: '#6366f1',
      isActive: true,
      plan: 'free',
      whatsappEnabled: true,
      createdAt: new Date().toISOString(),
    }
  ],
  users: [],
  patients: [],
  services: [],
  appointments: [],
  payments: [],
};

// ==================== DATOS DE PRUEBA ====================

async function initData() {
  // Super Admin
  const adminPass = await bcrypt.hash('admin123', 10);
  db.users.push({
    id: 'user-001',
    email: 'admin@clinicpro.com',
    password: adminPass,
    name: 'Administrador Principal',
    phone: '+34 600 000 001',
    role: 'SUPER_ADMIN',
    isActive: true,
    clinicId: null,
    createdAt: new Date().toISOString(),
  });

  // Admin de Clínica
  const clinicAdminPass = await bcrypt.hash('clinica123', 10);
  db.users.push({
    id: 'user-002',
    email: 'clinica@demo.com',
    password: clinicAdminPass,
    name: 'Admin Clínica Demo',
    phone: '+34 600 000 002',
    role: 'CLINIC_ADMIN',
    isActive: true,
    clinicId: 'clinic-001',
    createdAt: new Date().toISOString(),
  });

  // Staff
  const staffPass = await bcrypt.hash('staff123', 10);
  db.users.push({
    id: 'user-003',
    email: 'staff@demo.com',
    password: staffPass,
    name: 'Personal de Clínica',
    phone: '+34 600 000 003',
    role: 'STAFF',
    isActive: true,
    clinicId: 'clinic-001',
    createdAt: new Date().toISOString(),
  });

  // Pacientes de ejemplo
  db.patients.push(
    {
      id: 'patient-001',
      clinicId: 'clinic-001',
      firstName: 'Juan',
      lastName: 'García',
      email: 'juan@email.com',
      phone: '+34 611 111 111',
      address: 'Calle Mayor 1',
      city: 'Madrid',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'patient-002',
      clinicId: 'clinic-001',
      firstName: 'María',
      lastName: 'López',
      email: 'maria@email.com',
      phone: '+34 622 222 222',
      address: 'Avenida Central 2',
      city: 'Barcelona',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'patient-003',
      clinicId: 'clinic-001',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      email: 'carlos@email.com',
      phone: '+34 633 333 333',
      address: 'Plaza España 3',
      city: 'Valencia',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  );

  // Servicios de ejemplo
  db.services.push(
    {
      id: 'service-001',
      clinicId: 'clinic-001',
      name: 'Consulta General',
      description: 'Consulta médica general',
      price: 50.00,
      duration: 30,
      category: 'consulta',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'service-002',
      clinicId: 'clinic-001',
      name: 'Revisión Completa',
      description: 'Revisión médica completa',
      price: 100.00,
      duration: 60,
      category: 'consulta',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'service-003',
      clinicId: 'clinic-001',
      name: 'Tratamiento Especializado',
      description: 'Tratamiento especializado',
      price: 150.00,
      duration: 45,
      category: 'tratamiento',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  );

  console.log('✅ Datos inicializados');
}

// ==================== MIDDLEWARE ====================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.clinicId = decoded.clinicId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ==================== ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = db.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Generar token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        clinicId: user.clinicId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Responder sin password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticate, (req, res) => {
  const user = db.users.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { password, ...userWithoutPassword } = user;
  
  // Incluir clínica si existe
  let response = { ...userWithoutPassword };
  if (user.clinicId) {
    const clinic = db.clinics.find(c => c.id === user.clinicId);
    if (clinic) {
      response.clinic = clinic;
    }
  }

  res.json(response);
});

// PUT /api/auth/profile
app.put('/api/auth/profile', authenticate, (req, res) => {
  const userIndex = db.users.findIndex(u => u.id === req.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { name, email, phone } = req.body;
  db.users[userIndex] = { 
    ...db.users[userIndex], 
    name: name || db.users[userIndex].name,
    email: email || db.users[userIndex].email,
    phone: phone || db.users[userIndex].phone,
    updatedAt: new Date().toISOString()
  };

  const { password, ...userWithoutPassword } = db.users[userIndex];
  res.json(userWithoutPassword);
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = db.users.find(u => u.id === req.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.updatedAt = new Date().toISOString();

  res.json({ message: 'Contraseña actualizada exitosamente' });
});

// GET /api/clinics
app.get('/api/clinics', (req, res) => {
  res.json(db.clinics);
});

// GET /api/clinics/:id
app.get('/api/clinics/:id', authenticate, (req, res) => {
  const clinic = db.clinics.find(c => c.id === req.params.id);
  
  if (!clinic) {
    return res.status(404).json({ error: 'Clínica no encontrada' });
  }

  res.json(clinic);
});

// GET /api/clinics/slug/:slug
app.get('/api/clinics/slug/:slug', (req, res) => {
  const clinic = db.clinics.find(c => c.slug === req.params.slug);
  
  if (!clinic) {
    return res.status(404).json({ error: 'Clínica no encontrada' });
  }

  res.json(clinic);
});

// POST /api/clinics (solo Super Admin)
app.post('/api/clinics', authenticate, (req, res) => {
  if (req.userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const clinic = {
    id: `clinic-${Date.now()}`,
    ...req.body,
    isActive: true,
    plan: 'free',
    whatsappEnabled: true,
    createdAt: new Date().toISOString(),
  };
  
  db.clinics.push(clinic);
  res.status(201).json({ message: 'Clínica creada', clinic });
});

// PUT /api/clinics/:id
app.put('/api/clinics/:id', authenticate, (req, res) => {
  const index = db.clinics.findIndex(c => c.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Clínica no encontrada' });
  }

  // Solo SUPER_ADMIN o CLINIC_ADMIN de esa clínica
  if (req.userRole !== 'SUPER_ADMIN' && req.clinicId !== req.params.id) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  db.clinics[index] = { 
    ...db.clinics[index], 
    ...req.body, 
    updatedAt: new Date().toISOString() 
  };
  
  res.json({ message: 'Clínica actualizada', clinic: db.clinics[index] });
});

// GET /api/dashboard
app.get('/api/dashboard', authenticate, (req, res) => {
  const clinicId = req.clinicId;
  
  // Para Super Admin sin clínica
  if (!clinicId) {
    return res.json({
      stats: {
        totalPatients: db.patients.length,
        totalServices: db.services.length,
        todayAppointments: 0,
        upcomingAppointments: 0,
        pendingAppointments: 0,
        completedThisMonth: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        totalRevenue: 0,
        totalDebt: 0,
      },
      recent: {
        patients: [],
        appointments: [],
        payments: [],
      }
    });
  }

  const patients = db.patients.filter(p => p.clinicId === clinicId);
  const services = db.services.filter(s => s.clinicId === clinicId);
  const appointments = db.appointments.filter(a => a.clinicId === clinicId);
  const payments = db.payments.filter(p => p.clinicId === clinicId);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const monthPayments = payments.filter(p => {
    const paymentDate = new Date(p.paidAt);
    return paymentDate.getMonth() === today.getMonth() && 
           paymentDate.getFullYear() === today.getFullYear();
  });

  const recentPatients = patients.slice(-5).reverse();
  const recentAppointments = appointments.slice(-5).reverse().map(a => ({
    ...a,
    patient: patients.find(p => p.id === a.patientId),
    service: services.find(s => s.id === a.serviceId),
  }));

  res.json({
    stats: {
      totalPatients: patients.length,
      totalServices: services.length,
      todayAppointments: todayAppointments.length,
      upcomingAppointments: appointments.filter(a => a.status === 'PENDING').length,
      pendingAppointments: appointments.filter(a => a.status === 'PENDING').length,
      completedThisMonth: appointments.filter(a => a.status === 'COMPLETED').length,
      todayRevenue: todayAppointments.reduce((sum, a) => sum + (a.price || 0), 0),
      monthRevenue: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      totalDebt: 0,
    },
    recent: {
      patients: recentPatients,
      appointments: recentAppointments,
      payments: payments.slice(-5).reverse(),
    }
  });
});

// ==================== ENDPOINTS ADICIONALES (para completar) ====================

// GET /api/patients
app.get('/api/patients', authenticate, (req, res) => {
  let patients = req.clinicId 
    ? db.patients.filter(p => p.clinicId === req.clinicId)
    : db.patients;

  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    patients = patients.filter(p => 
      p.firstName.toLowerCase().includes(search) ||
      p.lastName.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search)
    );
  }

  res.json({ data: patients, pagination: { page: 1, limit: 100, total: patients.length, pages: 1 } });
});

// POST /api/patients
app.post('/api/patients', authenticate, (req, res) => {
  const patient = {
    id: `patient-${Date.now()}`,
    ...req.body,
    clinicId: req.clinicId,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.patients.push(patient);
  res.status(201).json({ message: 'Paciente creado', patient });
});

// GET /api/services
app.get('/api/services', authenticate, (req, res) => {
  let services = req.clinicId 
    ? db.services.filter(s => s.clinicId === req.clinicId)
    : db.services;

  if (req.query.active === 'true') {
    services = services.filter(s => s.isActive);
  }

  res.json(services);
});

// POST /api/services
app.post('/api/services', authenticate, (req, res) => {
  const service = {
    id: `service-${Date.now()}`,
    ...req.body,
    clinicId: req.clinicId,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.services.push(service);
  res.status(201).json({ message: 'Servicio creado', service });
});

// GET /api/appointments
app.get('/api/appointments', authenticate, (req, res) => {
  let appointments = req.clinicId 
    ? db.appointments.filter(a => a.clinicId === req.clinicId)
    : db.appointments;

  const patients = db.patients.filter(p => p.clinicId === req.clinicId);
  const services = db.services.filter(s => s.clinicId === req.clinicId);

  const appointmentsWithDetails = appointments.map(a => ({
    ...a,
    patient: patients.find(p => p.id === a.patientId),
    service: services.find(s => s.id === a.serviceId),
  }));

  res.json({ 
    data: appointmentsWithDetails, 
    pagination: { page: 1, limit: 100, total: appointments.length, pages: 1 } 
  });
});

// GET /api/appointments/today
app.get('/api/appointments/today', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let appointments = req.clinicId 
    ? db.appointments.filter(a => a.clinicId === req.clinicId && a.date === today)
    : db.appointments.filter(a => a.date === today);

  const patients = db.patients.filter(p => p.clinicId === req.clinicId);
  const services = db.services.filter(s => s.clinicId === req.clinicId);

  const appointmentsWithDetails = appointments.map(a => ({
    ...a,
    patient: patients.find(p => p.id === a.patientId),
    service: services.find(s => s.id === a.serviceId),
  }));

  res.json(appointmentsWithDetails);
});

// POST /api/appointments
app.post('/api/appointments', authenticate, (req, res) => {
  const appointment = {
    id: `appointment-${Date.now()}`,
    ...req.body,
    clinicId: req.clinicId,
    status: 'PENDING',
    notificationSent: false,
    reminderSent: false,
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(appointment);

  const patient = db.patients.find(p => p.id === appointment.patientId);
  const service = db.services.find(s => s.id === appointment.serviceId);

  res.status(201).json({ 
    message: 'Cita creada', 
    appointment: { ...appointment, patient, service }
  });
});

// GET /api/appointments/availability - Horarios disponibles
app.get('/api/appointments/availability', authenticate, (req, res) => {
  const { date, duration } = req.query;
  
  if (!date || !duration) {
    return res.status(400).json({ error: 'Fecha y duración requeridas' });
  }

  const clinicId = req.clinicId;
  const durationMinutes = parseInt(String(duration));
  
  // Horario de trabajo: 9:00 - 18:00
  const startHour = 9;
  const endHour = 18;
  const interval = 30; // intervalos de 30 minutos
  
  // Generar todos los slots posibles
  const allSlots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      allSlots.push(time);
    }
  }
  
  // Obtener citas existentes para esa fecha
  const existingAppointments = clinicId 
    ? db.appointments.filter(a => a.clinicId === clinicId && a.date === date && a.status !== 'CANCELLED')
    : [];
  
  // Filtrar slots ocupados
  const occupiedSlots = new Set(existingAppointments.map(a => a.time));
  const availableSlots = allSlots.filter(slot => !occupiedSlots.has(slot));
  
  res.json({ 
    date,
    duration: durationMinutes,
    availableSlots,
    occupiedSlots: Array.from(occupiedSlots)
  });
});

// GET /api/payments
app.get('/api/payments', authenticate, (req, res) => {
  let payments = req.clinicId 
    ? db.payments.filter(p => p.clinicId === req.clinicId)
    : db.payments;

  const patients = db.patients.filter(p => p.clinicId === req.clinicId);

  const paymentsWithDetails = payments.map(p => ({
    ...p,
    patient: patients.find(pt => pt.id === p.patientId),
  }));

  res.json({ 
    data: paymentsWithDetails, 
    pagination: { page: 1, limit: 100, total: payments.length, pages: 1 } 
  });
});

// POST /api/payments
app.post('/api/payments', authenticate, (req, res) => {
  const payment = {
    id: `payment-${Date.now()}`,
    ...req.body,
    clinicId: req.clinicId,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  db.payments.push(payment);

  const patient = db.patients.find(p => p.id === payment.patientId);

  res.status(201).json({ 
    message: 'Pago registrado', 
    payment: { ...payment, patient }
  });
});

// GET /api/payments/summary
app.get('/api/payments/summary', authenticate, (req, res) => {
  const payments = req.clinicId 
    ? db.payments.filter(p => p.clinicId === req.clinicId)
    : db.payments;
  
  const today = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter(p => p.paidAt.startsWith(today));
  
  const thisMonth = new Date().getMonth();
  const monthPayments = payments.filter(p => new Date(p.paidAt).getMonth() === thisMonth);

  res.json({
    today: todayPayments.reduce((sum, p) => sum + p.amount, 0),
    month: monthPayments.reduce((sum, p) => sum + p.amount, 0),
    year: payments.reduce((sum, p) => sum + p.amount, 0),
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: 0,
    byMethod: []
  });
});

// GET /api/users
app.get('/api/users', authenticate, (req, res) => {
  let users = db.users;
  
  if (req.userRole === 'CLINIC_ADMIN') {
    users = users.filter(u => u.clinicId === req.clinicId);
  }
  
  if (req.query.clinicId) {
    users = users.filter(u => u.clinicId === req.query.clinicId);
  }

  const usersWithoutPassword = users.map(u => {
    const { password, ...rest } = u;
    return rest;
  });

  res.json(usersWithoutPassword);
});

// POST /api/users
app.post('/api/users', authenticate, async (req, res) => {
  const { email, password, name, role, clinicId, phone } = req.body;
  
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = {
    id: `user-${Date.now()}`,
    email,
    password: hashedPassword,
    name,
    role,
    clinicId: clinicId || req.clinicId,
    phone,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  
  db.users.push(user);
  
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json({ message: 'Usuario creado', user: userWithoutPassword });
});

// PUT /api/users/:id
app.put('/api/users/:id', authenticate, async (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const user = db.users[index];
  
  if (req.userRole === 'CLINIC_ADMIN' && user.clinicId !== req.clinicId) {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const { password, ...updateData } = req.body;
  
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  db.users[index] = { ...user, ...updateData, updatedAt: new Date().toISOString() };
  
  const { password: _, ...userWithoutPassword } = db.users[index];
  res.json(userWithoutPassword);
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ==================== START ====================

initData().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║           🏥 ClinicPro API Server v1.0.0               ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  🌐 Server running on: http://0.0.0.0:${PORT}           ║
║  📊 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  📧 Credenciales de prueba:                            ║
║                                                        ║
║  Super Admin:  admin@clinicpro.com / admin123          ║
║  Admin Clínica: clinica@demo.com / clinica123          ║
║  Staff:         staff@demo.com / staff123              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
  });
});
