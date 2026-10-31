{
  description = "Muziekhandel: a game for Dutch kids built on sheet music from Muziekschatten";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});

      # The game itself only needs a static file server; these packages are for the
      # scripts in scripts/ and tools/ (art import, score import, sheet2midi merge).
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
            echo "Serve the game: python3 -m http.server 8765  (or: nix run)"
          '';
        };
      });

      # `nix run` serves the current folder on http://localhost:8765
      apps = forAllSystems (pkgs: {
        default = {
          type = "app";
          program = toString (pkgs.writeShellScript "muziekhandel-serve" ''
            echo "Muziekhandel on http://localhost:''${PORT:-8765}"
            exec ${pkgs.python3}/bin/python3 -m http.server "''${PORT:-8765}"
          '');
          meta.description = "Serve the game on http://localhost:8765";
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
      });

      # On a NixOS server: import this module and set services.muziekhandel.enable = true.
      nixosModules.default = { config, lib, pkgs, ... }:
        let cfg = config.services.muziekhandel;
        in
        {
          options.services.muziekhandel = {
            enable = lib.mkEnableOption "the Muziekhandel game, served by nginx";
            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
              description = "The game files to serve.";
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
              };
            };
            networking.firewall.allowedTCPPorts = [ 80 ];
          };
        };
    };
}
