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

    def __str__(self):
        return f"Sesión: {self.patente} - {self.estado}"

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
