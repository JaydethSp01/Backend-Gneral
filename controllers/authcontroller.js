const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const register = async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const usuario = await Usuario.create({
      nombre,
      email,
      contraseña: hashedPassword,
    });
    res.status(201).json({ message: "Usuario registrado con éxito", usuario });
  } catch (error) {
    res.status(400).json({ message: "Error al registrar usuario", error });
  }
};

const login = async (req, res) => {
  const { email, contraseña } = req.body;
  try {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!isMatch)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    res.status(500).json({ message: "Error al iniciar sesión", error });
  }
};

module.exports = { register, login };
