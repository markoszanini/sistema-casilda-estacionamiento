from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import UserWallet, UserFavoriteVehicle, Transaction, ParkingSession, LPRScan, Infraction, SystemRole
from .serializers import (
    UserWalletSerializer,
    UserFavoriteVehicleSerializer,
    TransactionSerializer,
    ParkingSessionSerializer,
    LPRScanSerializer,
    InfractionSerializer,
    SystemRoleSerializer
)


def _period_start(period: str):
    now = timezone.now()
    if period == 'day':
        return now - timedelta(days=1)
    if period == 'week':
        return now - timedelta(days=7)
    if period == 'month':
        return now - timedelta(days=30)
    if period == 'year':
        return now - timedelta(days=365)
    return None


@api_view(['GET'])
def reports(request):
    """
    Reportes estadísticos para el dashboard municipal.
    GET /api/reports/?period=day|week|month|year  (vacío = histórico)
    """
    period = (request.query_params.get('period') or '').strip().lower()
    valid = {'', 'day', 'week', 'month', 'year'}
    if period not in valid:
        return Response(
            {'error': 'period inválido. Use day, week, month, year o vacío.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    start = _period_start(period)
    sessions = ParkingSession.objects.all()
    infractions = Infraction.objects.all()
    debit_tx = Transaction.objects.filter(tipo='DEBITO')

    if start is not None:
        sessions = sessions.filter(inicio__gte=start)
        infractions = infractions.filter(fecha_emision__gte=start)
        debit_tx = debit_tx.filter(fecha__gte=start)

    vehiculos = sessions.values('patente').distinct().count()
    monto_recaudado = debit_tx.aggregate(total=Sum('monto'))['total'] or Decimal('0')
    infracciones_agg = infractions.aggregate(
        cantidad=Count('id'),
        monto=Sum('monto_multa'),
    )

    return Response({
        'period': period or 'all',
        'vehiculos_estacionados': vehiculos,
        'monto_recaudado': float(monto_recaudado),
        'cantidad_infracciones': infracciones_agg['cantidad'] or 0,
        'monto_infracciones': float(infracciones_agg['monto'] or 0),
    })

class UserWalletViewSet(viewsets.ModelViewSet):
    queryset = UserWallet.objects.all()
    serializer_class = UserWalletSerializer

    @action(detail=True, methods=['post'])
    def recargar(self, request, pk=None):
        """
        Simula una recarga de saldo (MercadoPago mock para la demo).
        """
        from decimal import Decimal, InvalidOperation

        monto_raw = request.data.get('monto')
        try:
            monto = Decimal(str(monto_raw))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Monto inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        if monto <= 0:
            return Response({'error': 'El monto debe ser mayor a 0.'}, status=status.HTTP_400_BAD_REQUEST)

        billetera = self.get_object()
        billetera.saldo_actual += monto
        billetera.save()

        Transaction.objects.create(
            user_id=billetera.user_id,
            monto=monto,
            tipo='CREDITO',
            metodo_pago=request.data.get('metodo_pago', 'MercadoPago (demo)'),
        )

        return Response({
            'mensaje': 'Saldo cargado correctamente.',
            'monto_acreditado': float(monto),
            'saldo_actual': float(billetera.saldo_actual),
        }, status=status.HTTP_200_OK)

class UserFavoriteVehicleViewSet(viewsets.ModelViewSet):
    queryset = UserFavoriteVehicle.objects.all()
    serializer_class = UserFavoriteVehicleSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

class ParkingSessionViewSet(viewsets.ModelViewSet):
    queryset = ParkingSession.objects.all()
    serializer_class = ParkingSessionSerializer

    @action(detail=False, methods=['post'])
    def iniciar(self, request):
        """
        Inicia un nuevo estacionamiento validando el saldo.
        """
        user_id = request.data.get('user_id')
        patente = request.data.get('patente')
        
        if not user_id or not patente:
            return Response({'error': 'Faltan datos: user_id y patente son requeridos.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            billetera = UserWallet.objects.get(user_id=user_id)
        except UserWallet.DoesNotExist:
            return Response({'error': 'La billetera del usuario no existe.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Costo mínimo para arrancar (ej. $100 pesos/hora)
        COSTO_MINIMO = 100.00
        
        if float(billetera.saldo_actual) < COSTO_MINIMO:
            return Response(
                {'error': f'Saldo insuficiente. El mínimo es ${COSTO_MINIMO}. Tenés ${billetera.saldo_actual}.'}, 
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
            
        # Chequear que la patente no esté ya estacionada
        if ParkingSession.objects.filter(patente=patente, estado='ACTIVO').exists():
            return Response({'error': 'Este vehículo ya tiene un estacionamiento activo.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Creamos la sesión exitosamente
        sesion = ParkingSession.objects.create(
            user_id=user_id,
            patente=patente,
            estado='ACTIVO'
        )
        
        return Response({
            'mensaje': 'Estacionamiento activado correctamente.',
            'sesion_id': sesion.id,
            'saldo_actual': billetera.saldo_actual
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def finalizar(self, request):
        """
        Finaliza un estacionamiento activo, calcula el costo por minuto y lo descuenta.
        """
        sesion_id = request.data.get('sesion_id')
        
        if not sesion_id:
            return Response({'error': 'Falta el sesion_id.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            sesion = ParkingSession.objects.get(id=sesion_id, estado='ACTIVO')
        except ParkingSession.DoesNotExist:
            return Response({'error': 'No se encontró una sesión activa con ese ID.'}, status=status.HTTP_404_NOT_FOUND)
            
        # Calcular tiempo transcurrido
        from django.utils import timezone
        import math
        from decimal import Decimal
        
        sesion.fin = timezone.now()
        minutos = math.ceil((sesion.fin - sesion.inicio).total_seconds() / 60.0)
        
        if minutos < 1:
            minutos = 1  # Cobramos al menos 1 minuto
            
        # Tarifa: 100 pesos la hora
        TARIFA_POR_MINUTO = Decimal('100.0') / Decimal('60.0')
        costo_total = round(Decimal(minutos) * TARIFA_POR_MINUTO, 2)
        
        # Descontar de la billetera
        billetera = UserWallet.objects.get(user_id=sesion.user_id)
        billetera.saldo_actual -= costo_total
        billetera.save()
        
        # Registrar la transaccion contable
        Transaction.objects.create(
            user_id=sesion.user_id,
            monto=costo_total,
            tipo='DEBITO',
            metodo_pago='Saldo Billetera'
        )
        
        # Actualizar sesion
        sesion.estado = 'FINALIZADO'
        sesion.costo_total = costo_total
        sesion.save()
        
        return Response({
            'mensaje': 'Estacionamiento finalizado.',
            'minutos_transcurridos': minutos,
            'costo_cobrado': float(costo_total),
            'saldo_restante': float(billetera.saldo_actual)
        }, status=status.HTTP_200_OK)

class LPRScanViewSet(viewsets.ModelViewSet):
    queryset = LPRScan.objects.all()
    serializer_class = LPRScanSerializer

    def create(self, request, *args, **kwargs):
        """
        Recibe un escaneo LPR. Si la patente tiene sesión ACTIVA → VIGENTE (verde).
        Si no → EN_INFRACCION (rojo) y opcionalmente genera la multa.
        """
        from decimal import Decimal

        patente = (request.data.get('patente_leida') or '').strip().upper()
        if not patente:
            return Response({'error': 'patente_leida es requerida.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            latitud = float(request.data.get('latitud'))
            longitud = float(request.data.get('longitud'))
        except (TypeError, ValueError):
            return Response({'error': 'latitud y longitud son requeridas.'}, status=status.HTTP_400_BAD_REQUEST)

        sesion = ParkingSession.objects.filter(patente=patente, estado='ACTIVO').first()
        scan = LPRScan.objects.create(
            patente_leida=patente,
            latitud=latitud,
            longitud=longitud,
            parking_session=sesion,
            url_foto=request.data.get('url_foto') or None,
        )

        if sesion:
            estado = 'VIGENTE'
            infraccion_id = None
        else:
            estado = 'EN_INFRACCION'
            infraccion, _ = Infraction.objects.get_or_create(
                scan=scan,
                defaults={
                    'monto_multa': Decimal(str(request.data.get('monto_multa', '1500.00'))),
                    'estado': 'PENDIENTE',
                },
            )
            infraccion_id = infraccion.id

        return Response({
            'id': scan.id,
            'patente_leida': scan.patente_leida,
            'latitud': scan.latitud,
            'longitud': scan.longitud,
            'fecha_hora': scan.fecha_hora,
            'parking_session': sesion.id if sesion else None,
            'url_foto': scan.url_foto,
            'estado': estado,
            'infraction_id': infraccion_id,
        }, status=status.HTTP_201_CREATED)

class InfractionViewSet(viewsets.ModelViewSet):
    queryset = Infraction.objects.all()
    serializer_class = InfractionSerializer

    @action(detail=False, methods=['post'])
    def registrar(self, request):
        """
        Registra una infracción a partir de una patente (flujo inspector / LPR).
        """
        from decimal import Decimal, InvalidOperation

        patente = (request.data.get('patente') or '').strip().upper()
        if not patente:
            return Response({'error': 'La patente es requerida.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            latitud = float(request.data.get('latitud', -33.0444))
            longitud = float(request.data.get('longitud', -61.1681))
        except (TypeError, ValueError):
            return Response({'error': 'Coordenadas inválidas.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            monto = Decimal(str(request.data.get('monto_multa', '1500.00')))
        except (InvalidOperation, TypeError):
            return Response({'error': 'Monto de multa inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        sesion_activa = ParkingSession.objects.filter(patente=patente, estado='ACTIVO').first()
        scan = LPRScan.objects.create(
            patente_leida=patente,
            latitud=latitud,
            longitud=longitud,
            parking_session=sesion_activa,
        )
        infraccion = Infraction.objects.create(
            scan=scan,
            monto_multa=monto,
            estado='PENDIENTE',
        )

        return Response({
            'mensaje': 'Infracción registrada.',
            'infraction_id': infraccion.id,
            'scan_id': scan.id,
            'patente': patente,
            'tenia_sesion_activa': bool(sesion_activa),
            'monto_multa': float(monto),
        }, status=status.HTTP_201_CREATED)

class SystemRoleViewSet(viewsets.ModelViewSet):
    queryset = SystemRole.objects.all()
    serializer_class = SystemRoleSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Devuelve el rol de un usuario. Si no existe en la base, devuelve 'VECINO' por defecto.
        """
        user_id = kwargs.get('pk')
        try:
            role = SystemRole.objects.get(user_id=user_id)
            return Response({'user_id': role.user_id, 'rol': role.rol})
        except SystemRole.DoesNotExist:
            return Response({'user_id': int(user_id), 'rol': 'VECINO'})
