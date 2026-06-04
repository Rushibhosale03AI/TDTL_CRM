from django.core.management.base import BaseCommand
from sales.seed_data import run_seed


class Command(BaseCommand):
    help = 'Seed the database with demo data for testing'

    def handle(self, *args, **options):
        run_seed()
        self.stdout.write(self.style.SUCCESS('Successfully seeded database'))
