from django.db import models
from django.utils import timezone

class UserWallet(models.Model):
    """
    Billetera del usuario. Se asocia 1 a 1 con el usuario de Casilda Conecta mediante su ID.
    """
    user_id = models.IntegerField(primary_key=True, help_text="ID del usuario en Casilda Conecta")
    saldo_actual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Billetera Usuario {self.user_id} - Saldo: ${self.saldo_actual}"

class UserFavoriteVehicle(models.Model):
    """
    Vehículos guardados por los usuarios para rápido acceso en la app.
    """
    user_id = models.IntegerField(help_text="ID del usuario en Casilda Conecta")
    patente = models.CharField(max_length=10)
    alias = models.CharField(max_length=50, blank=True, null=True, help_text="Ej: Mi Auto")
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo = models.CharField(max_length=50, blank=True, null=True)
    anio = models.PositiveIntegerField(blank=True, null=True)
    color = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return f"{self.patente} ({self.alias})"

class Transaction(models.Model):
    """
    Historial de recargas de saldo y cobros de estacionamiento.
    """
    TIPO_CHOICES = [
        ('CREDITO', 'Crédito (Carga)'),
        ('DEBITO', 'Débito (Pago Estacionamiento)'),
    ]
    user_id = models.IntegerField(help_text="ID del usuario en Casilda Conecta")
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    metodo_pago = models.CharField(max_length=50, blank=True, null=True)
    fecha = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.tipo} - ${self.monto} - Usuario {self.user_id}"

class ParkingSession(models.Model):
    """
    Sesiones de estacionamiento activas o finalizadas.
    """
    ESTADO_CHOICES = [
        ('ACTIVO', 'Activo'),
        ('FINALIZADO', 'Finalizado'),
    ]
    user_id = models.IntegerField(help_text="ID del usuario que paga")
    patente = models.CharField(max_length=10, help_text="Patente estacionada")
    inicio = models.DateTimeField(default=timezone.now)
    fin = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='ACTIVO')
    costo_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    # Campos de testing: ubicación por sección y duración prepagada
    calle = models.CharField(max_length=80, blank=True, null=True)
    altura = models.PositiveIntegerField(blank=True, null=True)
    seccion = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    duracion_minutos = models.PositiveIntegerField(blank=True, null=True)
    medio_pago = models.CharField(max_length=50, blank=True, null=True, default='Billetera')
    marca = models.CharField(max_length=50, blank=True, null=True)
    modelo = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"Sesión: {self.patente} - {self.estado}"


class ActaInfraccion(models.Model):
    """
    Acta de infracción generada en testing (PDF / foto).
    No usar en gestión/producción.
    """
    patente = models.CharField(max_length=10)
    seccion = models.CharField(max_length=120, blank=True, null=True)
    url_foto = models.TextField(blank=True, null=True, help_text="URL o data-URL de la foto")
    observaciones = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    generada_por = models.IntegerField(blank=True, null=True, help_text="user_id inspector")

    def __str__(self):
        return f"Acta {self.id} · {self.patente}"

class LPRScan(models.Model):
    """
    Lecturas capturadas por las cámaras de fiscalización en la calle.
    """
    patente_leida = models.CharField(max_length=10)
    latitud = models.FloatField()
    longitud = models.FloatField()
    fecha_hora = models.DateTimeField(default=timezone.now)
    parking_session = models.ForeignKey(ParkingSession, on_delete=models.SET_NULL, null=True, blank=True, help_text="Nulo si no tenía pago activo")
    url_foto = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Scan {self.patente_leida} @ {self.fecha_hora}"

class Infraction(models.Model):
    """
    Multas autogeneradas.
    """
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('ANULADA', 'Anulada'),
    ]
    scan = models.OneToOneField(LPRScan, on_delete=models.CASCADE)
    monto_multa = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=15, choices=ESTADO_CHOICES, default='PENDIENTE')
    fecha_emision = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Infracción {self.id} - {self.estado}"

class SystemRole(models.Model):
    """
    Control de acceso. Asocia un ID de usuario a un rol específico.
    Si un user_id no existe acá, se asume que es VECINO.
    """
    ROL_CHOICES = [
        ('VECINO', 'Vecino'),
        ('INSPECTOR', 'Inspector'),
        ('EMPLEADO', 'Empleado Municipal'),
    ]
    user_id = models.IntegerField(primary_key=True, help_text="ID del usuario en Casilda Conecta")
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='VECINO')

    def __str__(self):
        return f"Usuario {self.user_id} - Rol: {self.rol}"
