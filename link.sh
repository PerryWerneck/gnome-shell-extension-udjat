#!/bin/bash
EXTENSION_ID=notifier@udjat.werneck.eti.br
EXTENSION_FOLDER="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_ID}"

echo "Extension folder is ${EXTENSION_FOLDER}"

rm -fr ${EXTENSION_FOLDER}
ln -sf $(readlink -f "${EXTENSION_ID}") "${EXTENSION_FOLDER}"

ls -l ${EXTENSION_FOLDER}/

sudo ln -sf $(readlink -f conf/gschema.xml) /usr/share/glib-2.0/schemas/br.eti.werneck.udjat.gnome.gschema.xml
sudo glib-compile-schemas /usr/share/glib-2.0/schemas

