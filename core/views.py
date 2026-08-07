from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import UserWallet, UserFavoriteVehicle, Transaction, ParkingSession, LPRScan, Infraction
from .serializers import (
    UserWalletSerializer,
    UserFavoriteVehicleSerializer,
    TransactionSerializer,
    ParkingSessionSerializer,
    LPRScanSerializer,
    InfractionSerializer
)

class UserWalletViewSet(viewsets.ModelViewSet):
    queryset = UserWallet.objects.all()
    serializer_class = UserWalletSerializer

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

class InfractionViewSet(viewsets.ModelViewSet):
    queryset = Infraction.objects.all()
    serializer_class = InfractionSerializer
