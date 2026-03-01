Output demo.gif

Require nvim
Require echo

Set Shell "zsh"
Set FontSize 32
Set Width 1980
Set Height 1080
Set FontFamily "JetBrainsMono Nerd Font"

Type@100ms "nvim" Sleep 200ms  Enter

Type@100ms "fCreate_0.gml foo" Enter Sleep 4s

Type "G" Enter Sleep 500ms

Type "K" Enter Sleep 2s

Type "o"

Ctrl+j Sleep 1s

Ctrl+k Sleep 2s

Type@300ms "bar" Sleep 2s

Type "." Sleep 2s

Ctrl+n Sleep 1s

Ctrl+n Sleep 1s Enter

Type@300ms " = -1;"

Type "jk" Sleep 300ms

Type@1s "0gld" Sleep 3s

Type@200ms ":wq" Sleep 100ms Enter


