#!/bin/bash
# IoT Device Agent Installation Script

set -e

echo "Installing IoT Device Agent..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create config directory if it doesn't exist
mkdir -p config logs

# Copy example config if config doesn't exist
if [ ! -f "config/agent.json" ]; then
    echo "Creating configuration file..."
    cp config/agent.json.example config/agent.json
    echo "Please edit config/agent.json with your server details and API token"
fi

# Make agent executable
chmod +x agent.py

echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit config/agent.json with your server details"
echo "2. Run './agent.py --test' to test the configuration"
echo "3. Run './agent.py --register' to register the device"
echo "4. Run './agent.py' to start the agent"