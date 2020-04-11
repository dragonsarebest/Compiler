default rel
section .text
global main
main:
lbl0:
mov rax, 1
cmp rax, 0
je lbl1
mov rax, 0
cmp rax, 0
je lbl2
mov rax, 1
ret
lbl2:
jmp lbl0
lbl1:
ret
section .data