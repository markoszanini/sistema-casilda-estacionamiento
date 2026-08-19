from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import UserWallet, UserFavoriteVehicle, Transaction, ParkingSession, LPRScan, Infraction, SystemRole, ActaInfraccion
from .serializers import (
    UserWalletSerializer,
    UserFavoriteVehicleSerializer,
    TransactionSerializer,
    ParkingSessionSerializer,
    LPRScanSerializer,
    InfractionSerializer,
    SystemRoleSerializer,
    ActaInfraccionSerializer,
)


def build_seccion(calle: str, altura: int) -> str:
    nombre = (calle or '').strip().upper()
    if not nombre or altura is None:
        return ''
    try:
        altura_int = int(altura)
    except (TypeError, ValueError):
        return ''
    if altura_int < 0:
        return ''
    base = (altura_int // 100) * 100
    return f'{nombre} {base}-{base + 100}'


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
        Inicia estacionamiento (testing): calle/altura → sección, duración prepagada y débito.
        """
        from decimal import Decimal

        user_id = request.data.get('user_id')
        patente = (request.data.get('patente') or '').strip().upper()
        calle = (request.data.get('calle') or '').strip().upper()
        altura = request.data.get('altura')
        duracion_minutos = request.data.get('duracion_minutos', 60)
        medio_pago = request.data.get('medio_pago') or 'Billetera'

        if not user_id or not patente:
            return Response(
                {'error': 'Faltan datos: user_id y patente son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not calle or altura is None:
            return Response(
                {'error': 'Faltan datos: calle y altura son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            altura_int = int(altura)
            duracion_int = int(duracion_minutos)
        except (TypeError, ValueError):
            return Response(
                {'error': 'altura y duracion_minutos deben ser numéricos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if duracion_int < 30 or duracion_int > 180 or duracion_int % 30 != 0:
            return Response(
                {'error': 'duracion_minutos debe ser entre 30 y 180, múltiplo de 30.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        seccion = build_seccion(calle, altura_int)
        if not seccion:
            return Response({'error': 'No se pudo calcular la sección.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            billetera = UserWallet.objects.get(user_id=user_id)
        except UserWallet.DoesNotExist:
            return Response({'error': 'La billetera del usuario no existe.'}, status=status.HTTP_404_NOT_FOUND)

        # Tarifa testing: $100/hora — se debita la franja completa al iniciar
        TARIFA_HORA = Decimal('100.00')
        costo = (Decimal(duracion_int) / Decimal('60')) * TARIFA_HORA
        costo = costo.quantize(Decimal('0.01'))

        if float(billetera.saldo_actual) < float(costo):
            return Response(
                {
                    'error': f'Saldo insuficiente. El costo es ${costo}. Tenés ${billetera.saldo_actual}.',
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        if ParkingSession.objects.filter(patente=patente, estado='ACTIVO').exists():
            return Response(
                {'error': 'Este vehículo ya tiene un estacionamiento activo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vehiculo = UserFavoriteVehicle.objects.filter(user_id=user_id, patente=patente).first()
        marca = vehiculo.marca if vehiculo else None
        modelo = vehiculo.modelo if vehiculo else None

        billetera.saldo_actual -= costo
        billetera.save()

        Transaction.objects.create(
            user_id=user_id,
            monto=costo,
            tipo='DEBITO',
            metodo_pago=medio_pago,
        )

        sesion = ParkingSession.objects.create(
            user_id=user_id,
            patente=patente,
            estado='ACTIVO',
            calle=calle,
            altura=altura_int,
            seccion=seccion,
            duracion_minutos=duracion_int,
            medio_pago=medio_pago,
            marca=marca,
            modelo=modelo,
            costo_total=costo,
        )

        return Response(
            {
                'mensaje': 'Estacionamiento activado correctamente.',
                'sesion_id': sesion.id,
                'seccion': seccion,
                'costo_cobrado': float(costo),
                'saldo_actual': float(billetera.saldo_actual),
                'duracion_minutos': duracion_int,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='por-seccion')
    def por_seccion(self, request):
        """Lista sesiones activas de una sección (testing inspector)."""
        seccion = (request.query_params.get('seccion') or '').strip().upper()
        if not seccion:
            return Response(
                {'error': 'Query param seccion es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sesiones = ParkingSession.objects.filter(estado='ACTIVO', seccion__iexact=seccion).order_by('-inicio')
        data = []
        for s in sesiones:
            fin_estimado = None
            if s.duracion_minutos:
                fin_estimado = (s.inicio + timedelta(minutes=s.duracion_minutos)).isoformat()
            data.append(
                {
                    'id': s.id,
                    'patente': s.patente,
                    'marca': s.marca,
                    'modelo': s.modelo,
                    'calle': s.calle,
                    'altura': s.altura,
                    'seccion': s.seccion,
                    'duracion_minutos': s.duracion_minutos,
                    'inicio': s.inicio.isoformat(),
                    'fin_estimado': fin_estimado,
                    'medio_pago': s.medio_pago,
                    'user_id': s.user_id,
                }
            )
        return Response(data)

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

        # Si ya se debitó al iniciar (franja prepagada testing), no cobrar de nuevo
        if sesion.costo_total and Decimal(sesion.costo_total) > 0 and sesion.duracion_minutos:
            billetera = UserWallet.objects.get(user_id=sesion.user_id)
            sesion.estado = 'FINALIZADO'
            sesion.save()
            return Response({
                'mensaje': 'Estacionamiento finalizado (ya cobrado al iniciar).',
                'minutos_transcurridos': minutos,
                'costo_cobrado': float(sesion.costo_total),
                'saldo_restante': float(billetera.saldo_actual),
            }, status=status.HTTP_200_OK)
            
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


class ActaInfraccionViewSet(viewsets.ModelViewSet):
    """Actas de testing — no usar en gestión."""

    queryset = ActaInfraccion.objects.all().order_by('-timestamp')
    serializer_class = ActaInfraccionSerializer

    def create(self, request, *args, **kwargs):
        patente = (request.data.get('patente') or '').strip().upper()
        seccion = (request.data.get('seccion') or '').strip().upper() or None
        url_foto = request.data.get('url_foto')
        observaciones = request.data.get('observaciones')
        generada_por = request.data.get('generada_por')

        if not patente:
            return Response({'error': 'patente es requerida.'}, status=status.HTTP_400_BAD_REQUEST)

        acta = ActaInfraccion.objects.create(
            patente=patente,
            seccion=seccion,
            url_foto=url_foto,
            observaciones=observaciones,
            generada_por=generada_por,
        )
        return Response(
            {
                'id': acta.id,
                'patente': acta.patente,
                'seccion': acta.seccion,
                'url_foto': acta.url_foto,
                'observaciones': acta.observaciones,
                'timestamp': acta.timestamp.isoformat(),
                'mensaje': 'Acta registrada (testing). Impresión física pendiente de definición.',
            },
            status=status.HTTP_201_CREATED,
        )
