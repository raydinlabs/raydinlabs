INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('The work spans the onboard electronics, embedded firmware, and ground-side controls. These are the connected parts of the system, from sensing onboard to interaction at the ground station.

Detailed build records, test results, and demonstration footage have not yet been published.','','','','',1,'2026-10-20T00:00:00.000Z','cosmo-can','projects','COSMO CAN','Connecting onboard avionics and firmware to ground station hardware and software.','## From onboard avionics to the ground station

Pramath developed the CanSat avionics and firmware, together with the ground station control hardware and software. The project connects the onboard system with its ground-side interface.

## Engineering scope

- CanSat avionics hardware
- Onboard embedded firmware
- Ground station control hardware
- Ground station software');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('Each application requires its own firmware, interfaces, and validation. Suitability must be checked against the platform and mission requirements.

These are intended applications, not claims of flight qualification. Hardware demonstrations and detailed validation records will be added when available.','','','','',1,'2026-10-20T00:00:00.000Z','fcv1','projects','FCV1','A custom modular flight controller for experimental platforms.','## One controller, multiple possibilities

FCV1 is a custom-designed modular flight controller intended for rockets, weather balloons, CanSats, and quadcopters.

## Intended applications

- Rockets
- Weather balloons
- CanSats
- Quadcopters');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('The architecture aims to let individual modules evolve as experiment requirements change. It remains in development; final hardware, benchmarks, and demonstrations are not yet published.','','','','',1,'2026-10-20T00:00:00.000Z','oma-x','projects','OMA – X','An upcoming modular avionics architecture built around experimentation and repairability.','## Designed to evolve with the experiment

OMA – X is an upcoming modular flight controller architecture focused on research, repairability, and experimentation.

## Design direction

- Replaceable modules
- Repairability as a design goal
- Flexible experimentation
- Reusable interfaces');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('','','','','',1,'2026-10-20T00:00:00.000Z','board-power','wiki','A new board will not power up','A starting checklist for PCB power troubleshooting.','Inspect polarity, solder bridges, and component orientation before applying power. With the board unpowered, check for an unexpected short between supply and ground.

Use a current-limited supply at the specified input voltage. Stop if current or temperature is abnormal. Check each rail against the design before attaching other equipment.');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('','','','','',1,'2026-10-20T00:00:00.000Z','serial-data','wiki','A serial connection shows no data','Check port settings, wiring, and signal levels.','Confirm the correct port, baud rate, and framing settings. Check TX-to-RX wiring and a common reference ground where required.

Verify voltage-level compatibility before connecting devices. TTL UART and RS-232 are not interchangeable. Test one link at a time with a known-good message.');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('','','','','',1,'2026-10-20T00:00:00.000Z','sensor-response','wiki','A sensor is not responding','First checks for I²C and SPI devices.','Confirm supply and logic voltage, interface mode, and pin assignment against the datasheet.

For I²C, check the address and pull-ups. For SPI, check chip select and clock mode. Start at a supported low bus speed and inspect the bus if the device remains silent.');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('','','','','',1,'2026-10-20T00:00:00.000Z','report-problem','wiki','How to report a reproducible problem','Provide the information someone else needs to reproduce your issue.','Include the objective, hardware revision, firmware version, wiring, exact symptoms, expected behavior, and steps to reproduce.

Share relevant logs and what you have already tried. Remove secrets, personal information, and proprietary files before posting publicly.');
INSERT OR IGNORE INTO entries (process,demo_url,document_url,image_url,image_alt,published,updated_at,id,kind,title,summary,body) VALUES ('','https://www.youtube.com/@RaydinLabs/videos','','','',1,'2026-10-20T00:00:00.000Z','youtube-builds','content','Engineering, in motion','Build stories, project walkthroughs, and technical explainers from Raydin Labs.','Follow Raydin Labs on YouTube for published videos and new uploads. Individual project demonstrations can be added to their project field notes as they become available.');