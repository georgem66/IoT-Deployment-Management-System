#!/usr/bin/env python3
"""
Secure IoT Device Agent

A lightweight Python agent that runs on IoT devices to:
- Collect system telemetry data (CPU, memory, disk, network)
- Send periodic heartbeats to the central management system
- Receive and execute remote commands securely
- Report security status and vulnerabilities

Author: IoT Security Team
License: MIT
"""

import time
import json
import logging
import hashlib
import platform
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional
import psutil
import requests
from cryptography.fernet import Fernet


class IoTAgent:
    """Secure IoT Device Agent for monitoring and management"""

    def __init__(self, config_path: str = "config/agent.json"):
        """Initialize the IoT agent with configuration"""
        self.config = self._load_config(config_path)
        self.device_id = self.config.get("device_id")
        self.server_url = self.config.get("server_url", "http://localhost:3000")
        self.heartbeat_interval = self.config.get("heartbeat_interval", 30)
        self.telemetry_interval = self.config.get("telemetry_interval", 60)
        self.api_token = self.config.get("api_token")
        
        # Setup logging
        self._setup_logging()
        
        # Initialize encryption if key is provided
        self.cipher = None
        if self.config.get("encryption_key"):
            self.cipher = Fernet(self.config["encryption_key"].encode())
        
        # Device information
        self.device_info = self._get_device_info()
        
        self.logger.info(f"IoT Agent initialized for device: {self.device_id}")

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Create default config if not exists
            default_config = {
                "device_id": "iot-device-" + hashlib.md5(platform.node().encode()).hexdigest()[:8],
                "server_url": "http://localhost:3000",
                "heartbeat_interval": 30,
                "telemetry_interval": 60,
                "api_token": "",
                "encryption_key": "",
                "log_level": "INFO"
            }
            with open(config_path, 'w') as f:
                json.dump(default_config, f, indent=2)
            print(f"Created default configuration at {config_path}")
            print("Please update the configuration with your server details and API token")
            return default_config

    def _setup_logging(self):
        """Configure logging for the agent"""
        log_level = getattr(logging, self.config.get("log_level", "INFO"))
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/agent.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('IoTAgent')

    def _get_device_info(self) -> Dict[str, str]:
        """Get basic device information"""
        return {
            "hostname": platform.node(),
            "os": platform.system(),
            "os_version": platform.release(),
            "architecture": platform.machine(),
            "python_version": platform.python_version(),
            "agent_version": "1.0.0"
        }

    def _make_request(self, endpoint: str, method: str = "POST", data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to the server with proper authentication"""
        url = f"{self.server_url}/api/{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"IoT-Agent/1.0.0 ({platform.system()})"
        }
        
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"

        try:
            if method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=10)
            else:
                response = requests.get(url, headers=headers, timeout=10)
            
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            return None

    def collect_telemetry(self) -> Dict[str, Any]:
        """Collect system telemetry data"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network statistics
            network = psutil.net_io_counters()
            
            # System uptime
            boot_time = psutil.boot_time()
            uptime = time.time() - boot_time
            
            # Temperature (if available)
            temperature = None
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    # Get first available temperature sensor
                    for sensor_name, sensor_list in temps.items():
                        if sensor_list:
                            temperature = sensor_list[0].current
                            break
            except (AttributeError, OSError):
                pass  # Temperature sensors not available
            
            # Battery level (for mobile devices)
            battery = None
            try:
                battery_info = psutil.sensors_battery()
                if battery_info:
                    battery = battery_info.percent
            except AttributeError:
                pass  # Battery info not available
            
            telemetry = {
                "device_id": self.device_id,
                "timestamp": datetime.utcnow().isoformat(),
                "cpu_usage": cpu_percent,
                "cpu_count": cpu_count,
                "memory_usage": (memory.used / memory.total) * 100,
                "memory_total": memory.total,
                "memory_used": memory.used,
                "disk_usage": (disk.used / disk.total) * 100,
                "disk_total": disk.total,
                "disk_used": disk.used,
                "network_bytes_sent": network.bytes_sent,
                "network_bytes_recv": network.bytes_recv,
                "network_packets_sent": network.packets_sent,
                "network_packets_recv": network.packets_recv,
                "uptime": uptime,
                "temperature": temperature,
                "battery_level": battery
            }
            
            return telemetry
            
        except Exception as e:
            self.logger.error(f"Error collecting telemetry: {e}")
            return {}

    def send_heartbeat(self) -> bool:
        """Send heartbeat to the server"""
        heartbeat_data = {
            "device_id": self.device_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online",
            "device_info": self.device_info
        }
        
        response = self._make_request("devices/heartbeat", "POST", heartbeat_data)
        if response:
            self.logger.debug("Heartbeat sent successfully")
            return True
        else:
            self.logger.warning("Failed to send heartbeat")
            return False

    def send_telemetry(self) -> bool:
        """Send telemetry data to the server"""
        telemetry_data = self.collect_telemetry()
        if not telemetry_data:
            return False
        
        response = self._make_request("telemetry/data", "POST", telemetry_data)
        if response:
            self.logger.debug("Telemetry data sent successfully")
            return True
        else:
            self.logger.warning("Failed to send telemetry data")
            return False

    def register_device(self) -> bool:
        """Register this device with the server"""
        registration_data = {
            "device_id": self.device_id,
            "name": f"{self.device_info['hostname']} ({self.device_info['os']})",
            "device_type": self._detect_device_type(),
            "os_info": f"{self.device_info['os']} {self.device_info['os_version']}",
            "firmware_version": self.device_info["agent_version"],
            "mac_address": self._get_mac_address(),
            "ip_address": self._get_ip_address(),
            "location": self.config.get("location", "Unknown"),
            "description": f"IoT device running {self.device_info['os']} with Python agent"
        }
        
        response = self._make_request("devices/register", "POST", registration_data)
        if response:
            self.logger.info("Device registered successfully")
            return True
        else:
            self.logger.error("Failed to register device")
            return False

    def _detect_device_type(self) -> str:
        """Detect the type of device"""
        hostname = self.device_info['hostname'].lower()
        if 'raspberry' in hostname or 'rpi' in hostname:
            return "Raspberry Pi"
        elif 'arduino' in hostname:
            return "Arduino"
        elif 'sensor' in hostname:
            return "Smart Sensor"
        else:
            return "IoT Device"

    def _get_mac_address(self) -> str:
        """Get the MAC address of the primary network interface"""
        try:
            import uuid
            mac = uuid.UUID(int=uuid.getnode()).hex[-12:]
            return ":".join([mac[e:e+2] for e in range(0, 11, 2)])
        except Exception:
            return "00:00:00:00:00:00"

    def _get_ip_address(self) -> str:
        """Get the primary IP address"""
        try:
            import socket
            # Connect to a remote address to get local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def run_security_check(self) -> Dict[str, Any]:
        """Run basic security checks"""
        checks = {
            "timestamp": datetime.utcnow().isoformat(),
            "device_id": self.device_id,
            "checks": {}
        }
        
        try:
            # Check for open ports
            open_ports = []
            for port in [22, 23, 80, 443, 8080, 8443]:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                if result == 0:
                    open_ports.append(port)
                sock.close()
            
            checks["checks"]["open_ports"] = open_ports
            
            # Check system updates (Linux only)
            if platform.system() == "Linux":
                try:
                    result = subprocess.run(
                        ["apt", "list", "--upgradable"],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    upgradable_count = len(result.stdout.strip().split('\n')) - 1  # Exclude header
                    checks["checks"]["available_updates"] = max(0, upgradable_count)
                except Exception:
                    checks["checks"]["available_updates"] = "unknown"
            
            # Check disk space
            disk = psutil.disk_usage('/')
            disk_usage_percent = (disk.used / disk.total) * 100
            checks["checks"]["disk_usage_critical"] = disk_usage_percent > 90
            
            # Check memory usage
            memory = psutil.virtual_memory()
            checks["checks"]["memory_usage_critical"] = memory.percent > 90
            
        except Exception as e:
            self.logger.error(f"Error running security check: {e}")
        
        return checks

    def run(self):
        """Main agent loop"""
        self.logger.info("Starting IoT Agent...")
        
        # Try to register device on startup
        self.register_device()
        
        last_heartbeat = 0
        last_telemetry = 0
        
        try:
            while True:
                current_time = time.time()
                
                # Send heartbeat
                if current_time - last_heartbeat >= self.heartbeat_interval:
                    self.send_heartbeat()
                    last_heartbeat = current_time
                
                # Send telemetry
                if current_time - last_telemetry >= self.telemetry_interval:
                    self.send_telemetry()
                    last_telemetry = current_time
                
                # Sleep for a short interval
                time.sleep(5)
                
        except KeyboardInterrupt:
            self.logger.info("Agent stopped by user")
        except Exception as e:
            self.logger.error(f"Agent error: {e}")
        finally:
            self.logger.info("IoT Agent shutting down...")


if __name__ == "__main__":
    import argparse
    import socket
    
    parser = argparse.ArgumentParser(description="Secure IoT Device Agent")
    parser.add_argument("--config", default="config/agent.json", help="Configuration file path")
    parser.add_argument("--register", action="store_true", help="Register device and exit")
    parser.add_argument("--test", action="store_true", help="Run test and exit")
    
    args = parser.parse_args()
    
    agent = IoTAgent(args.config)
    
    if args.register:
        agent.register_device()
    elif args.test:
        print("Device Information:")
        print(json.dumps(agent.device_info, indent=2))
        print("\nTelemetry Sample:")
        print(json.dumps(agent.collect_telemetry(), indent=2))
        print("\nSecurity Check:")
        print(json.dumps(agent.run_security_check(), indent=2))
    else:
        agent.run()