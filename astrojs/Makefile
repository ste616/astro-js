# Makefile to minify the astrojs source files.
MINI=uglifyjs
MINIARGS=-c -m

SRCFILES=angle base coordinate skyCoordinate sourceResolver source time useful

minify:
	$(foreach f,$(SRCFILES),$(MINI) $(MINIARGS) -o $(f).js $(f).src.js;)

clean:
	$(foreach f,$(SRCFILES),rm -f $(f).js;)

default: minify

