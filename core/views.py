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

class LPRScanViewSet(viewsets.ModelViewSet):
    queryset = LPRScan.objects.all()
    serializer_class = LPRScanSerializer

class InfractionViewSet(viewsets.ModelViewSet):
    queryset = Infraction.objects.all()
    serializer_class = InfractionSerializer
