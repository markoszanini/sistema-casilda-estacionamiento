from decimal import Decimal

from django.core.management.base import BaseCommand

from core.models import Infraction, LPRScan, ParkingSession, UserFavoriteVehicle, UserWallet


class Command(BaseCommand):
    help = 'Carga datos de demo para la app vecino y el dashboard municipal.'

    def handle(self, *args, **options):
        wallet, _ = UserWallet.objects.update_or_create(
            user_id=1,
            defaults={'saldo_actual': Decimal('500.00')},
        )
        UserFavoriteVehicle.objects.update_or_create(
            user_id=1,
            patente='AB123CD',
            defaults={'alias': 'Auto principal'},
        )

        # Infracción de ejemplo (patente sin sesión activa)
        scan, _ = LPRScan.objects.get_or_create(
            patente_leida='XX999ZZ',
            defaults={
                'latitud': -33.0444,
                'longitud': -61.1681,
                'url_foto': '',
            },
        )
        Infraction.objects.get_or_create(
            scan=scan,
            defaults={
                'monto_multa': Decimal('1500.00'),
                'estado': 'PENDIENTE',
            },
        )

        activas = ParkingSession.objects.filter(estado='ACTIVO').count()
        self.stdout.write(
            self.style.SUCCESS(
                f'Demo lista: wallet user_id={wallet.user_id} saldo=${wallet.saldo_actual} | '
                f'sesiones activas={activas} | infracciones={Infraction.objects.count()}'
            )
        )
