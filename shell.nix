{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs 
    (nodePackages.pnpm.override { version = "8.6.0"; }) 
  ];

  shellHook = ''
    export PATH=$PATH:${pkgs.nodePackages.pnpm}/bin
  '';
}
