{
  description = "Muziekhandel: a game for Dutch kids built on sheet music from Muziekschatten";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      # The game and its back end (backend/server.py) need only Python's standard library; these
      # packages are for the scripts in scripts/ and tools/ (art import, score import, sheet2midi merge).
      python = pkgs: pkgs.python3.withPackages (ps: with ps; [
        pillow
        numpy
        scipy
        pymupdf
      ]);
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [ (python pkgs) ];
          shellHook = ''
            echo "Run the game and its back end: python3 backend/server.py  (or: nix run)"
          '';
        };
      });

      # `nix run` serves the current folder and the back end on http://localhost:8765, with the
      # data from Virtuoso on localhost:8890 (SPARQL=... for another endpoint)
      apps = forAllSystems (pkgs: {
        default = {
          type = "app";
          program = toString (pkgs.writeShellScript "muziekhandel-serve" ''
            exec ${pkgs.python3}/bin/python3 ${./backend/server.py} --root "$PWD" \
              --port "''${PORT:-8765}" --sparql "''${SPARQL:-http://localhost:8890/sparql}"
          '');
          meta.description = "Serve the game and its back end on http://localhost:8765";
        };
      });

      # The files the browser loads, for deploying. No build step: just a copy.
      packages = forAllSystems (pkgs: {
        default = pkgs.stdenvNoCC.mkDerivation {
          pname = "muziekhandel";
          version = "0.1.0";
          src = nixpkgs.lib.fileset.toSource {
            root = ./.;
            fileset = nixpkgs.lib.fileset.unions [ ./index.html ./css ./js ./public ./assets ];
          };
          installPhase = "cp -r . $out";
        };
        # The back end: the API over Virtuoso that the game asks for its composers and sheet music.
        api = pkgs.writeShellScriptBin "muziekhandel-api" ''
          exec ${pkgs.python3}/bin/python3 ${./backend/server.py} "$@"
        '';
      });

      # On a NixOS server: import this module and set services.muziekhandel.enable = true. nginx serves
      # the game and passes /api/ to the back end, which asks Virtuoso; Virtuoso itself stays private.
      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.muziekhandel;
          apiPort = 8766;
        in
        {
          options.services.muziekhandel = {
            enable = lib.mkEnableOption "the Muziekhandel game, served by nginx";
            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
              description = "The game files to serve.";
            };
            sparqlEndpoint = lib.mkOption {
              type = lib.types.str;
              default = "http://127.0.0.1:8890/sparql";
              description = "Virtuoso's SPARQL endpoint, where the back end gets the composers and sheet music.";
            };
          };

          config = lib.mkIf cfg.enable {
            services.nginx = {
              enable = true;
              recommendedGzipSettings = true;
              recommendedOptimisation = true;
              # The only site: it answers on any domain name or IP address.
              virtualHosts.muziekhandel = {
                default = true;
                root = cfg.package;
                locations."/api/".proxyPass = "http://127.0.0.1:${toString apiPort}";
              };
            };
            systemd.services.muziekhandel-api = {
              description = "Muziekhandel back end";
              wantedBy = [ "multi-user.target" ];
              after = [ "network.target" ];
              serviceConfig = {
                ExecStart = "${self.packages.${pkgs.stdenv.hostPlatform.system}.api}/bin/muziekhandel-api"
                  + " --host 127.0.0.1 --port ${toString apiPort} --sparql ${cfg.sparqlEndpoint} --root ${cfg.package}";
                DynamicUser = true;
                Restart = "on-failure";
                ProtectSystem = "strict";
                ProtectHome = true;
                PrivateTmp = true;
                NoNewPrivileges = true;
              };
            };
            networking.firewall.allowedTCPPorts = [ 80 ];
          };
        };
    };
}
