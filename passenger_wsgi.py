import sys

# Add your project directory to the Python path
project_home = '/home/seruji/verseo'
if project_home not in sys.path:
    sys.path.append(project_home)

# Import your Flask app
from app import app as application 