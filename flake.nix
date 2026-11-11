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
            pkgs.csound    # just lofi: the radio's pieces, written in Csound (music/)
          ];
          # the instruments of `just lofi`: FluidR3 GM (Frank Wen, MIT)
          ROOM_SF2 = "${pkgs.soundfont-fluid}/share/soundfonts/FluidR3_GM2-2.sf2";
          shellHook = ''
            echo "room: just --list"
          '';
        };
      });
    };
}
