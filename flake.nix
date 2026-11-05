{
  description = "room: a 3D room as a personal site (Vite + three.js)";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAll (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_22 # vite, three, scripts/check.mjs
            pkgs.just      # the recipes in justfile
            pkgs.ffmpeg    # just audio: loudness and format for sounds
          ];
          shellHook = ''
            echo "room: just --list"
          '';
        };
      });
    };
}
