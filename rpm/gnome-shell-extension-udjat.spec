#
# spec file for package gnome-shell-extension-udjat
#
# Copyright (c) 2015 SUSE LINUX GmbH, Nuernberg, Germany.
# Copyright (C) <2008> <Banco do Brasil S.A.>
#
# All modifications and additions to the file contributed by third parties
# remain the property of their copyright owners, unless otherwise agreed
# upon. The license for this file, and modifications and additions to the
# file, is the same license as for the pristine package itself (unless the
# license for the pristine package is not an Open Source License, in which
# case the license is the MIT License). An "Open Source License" is a
# license that conforms to the Open Source Definition (Version 1.9)
# published by the Open Source Initiative.

# Please submit bugfixes or comments via http://bugs.opensuse.org/
#

# Minimum GNOME Shell version supported
%global min_gs_version 3.34

%global product_name %(pkg-config --variable=product_name libudjat)

%global uuid notifier@udjat.werneck.eti.br
%global _gsextdir %{_datadir}/gnome-shell/extensions

Name:					gnome-shell-extension-udjat
Version:				1.0
Release:				0
Summary:				Gnome shell extension for %{product_name}
Group:					System/GUI/Other

License:				LGPL-3.0
Source:					%{name}-%{version}.tar.xz

URL:					https://github.com/PerryWerneck/gnome-shell-extension-udjat

BuildRoot:				/var/tmp/%{name}-%{version}

BuildArch:				noarch

BuildRequires:			fdupes
BuildRequires:			pkgconfig(libudjat)

#BuildRequires:			gio
#BuildRequires:			gnome-shell >= %{min_gs_version}
#BuildRequires:			unzip
#BuildRequires:			find
#BuildRequires:			appstream-glib

# Pre-reqs
Requires:				gnome-shell >= %{min_gs_version}
Requires:				gjs
Requires:				udjat-branding

#Requires(post):			desktop-file-utils
#Requires(postun):		desktop-file-utils

#BuildRequires:			scour
#Requires(pre):			dconf

Enhances:				%{product_name}

BuildRequires:			glib2-devel

%glib2_gsettings_schema_requires

%description
Gnome shell extension to notify on %{product_name}'s events.

%prep
%setup -n %{name}-%{version}

%build

%install
rm -rf $RPM_BUILD_ROOT

%{__install} \
	-d \
    --mode=755 \
	%{buildroot}/%{_gsextdir}/%{uuid}

%{__install} \
	--mode=644 \
	%{uuid}/* \
	%{buildroot}/%{_gsextdir}/%{uuid}

%{__install} \
	--mode=755 \
	-d %{buildroot}%{_datadir}/glib-2.0/schemas

%{__install} \
	--mode=644 \
	conf/gschema.xml \
	%{buildroot}%{_datadir}/glib-2.0/schemas/br.eti.werneck.udjat.gnome.gschema.xml

%fdupes $RPM_BUILD_ROOT

%files
%defattr(-,root,root)

%dir %{_datadir}/gnome-shell
%dir %{_datadir}/gnome-shell/extensions

%dir %{_gsextdir}
%dir %{_gsextdir}/%{uuid}

%{_gsextdir}/%{uuid}/*.js
%{_gsextdir}/%{uuid}/*.css
%{_gsextdir}/%{uuid}/*.json

%{_datadir}/glib-2.0/schemas/*.gschema.xml

%post
%glib2_gsettings_schema_post

%postun
%glib2_gsettings_schema_postun

%changelog

