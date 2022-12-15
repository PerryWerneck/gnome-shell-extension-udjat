#!/bin/bash

LEVEL="ready"
SUMMARY="Test message"

dbus-send \
	--system \
	--type=signal \
	/ \
	br.eti.werneck.udjat.gnome.GlobalStateChanged \
	string:"${LEVEL}" \
	string:"${SUMMARY}"
	
echo $?

