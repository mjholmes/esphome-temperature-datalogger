CONFIG := calorifier-logger.yaml
ESPHOME := .venv/bin/esphome
# USB port for first flash; afterwards use DEVICE=calorifier-logger.local (or its IP) for OTA
DEVICE ?= /dev/ttyACM0

.PHONY: setup config compile upload logs clean

setup:
	uv venv --python 3.13 .venv
	uv pip install --python .venv esphome
	@test -f secrets.yaml || (cp secrets.example.yaml secrets.yaml && echo "Created secrets.yaml - edit it")

config:
	$(ESPHOME) config $(CONFIG)

compile:
	$(ESPHOME) compile $(CONFIG)

upload:
	$(ESPHOME) run $(CONFIG) --device $(DEVICE) --no-logs

logs:
	$(ESPHOME) logs $(CONFIG) --device $(DEVICE)

clean:
	$(ESPHOME) clean $(CONFIG)
