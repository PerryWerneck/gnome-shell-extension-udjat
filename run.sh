#!/bin/bash
gnome-extensions enable notifier@udjat.werneck.eti.br
dbus-run-session -- gnome-shell --nested --wayland
gnome-extensions disable notifier@udjat.werneck.eti.br

