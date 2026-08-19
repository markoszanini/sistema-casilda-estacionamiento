# Generated manually for testing flows

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_systemrole'),
    ]

    operations = [
        migrations.AddField(
            model_name='parkingsession',
            name='calle',
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='altura',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='seccion',
            field=models.CharField(blank=True, db_index=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='duracion_minutos',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='medio_pago',
            field=models.CharField(blank=True, default='Billetera', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='marca',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='parkingsession',
            name='modelo',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.CreateModel(
            name='ActaInfraccion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('patente', models.CharField(max_length=10)),
                ('seccion', models.CharField(blank=True, max_length=120, null=True)),
                ('url_foto', models.TextField(blank=True, help_text='URL o data-URL de la foto', null=True)),
                ('observaciones', models.TextField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(default=django.utils.timezone.now)),
                ('generada_por', models.IntegerField(blank=True, help_text='user_id inspector', null=True)),
            ],
        ),
    ]
