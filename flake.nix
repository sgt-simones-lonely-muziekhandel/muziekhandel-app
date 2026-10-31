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
    };
}
