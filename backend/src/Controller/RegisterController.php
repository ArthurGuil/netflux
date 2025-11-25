<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegisterController extends AbstractController
{
    public function __invoke(
        Request $request,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setPassword($data['password'] ?? '');

        $errors = $validator->validate($user, null, ['user:write']);

        if (count($errors) > 0) {
            $violations = [];

            foreach ($errors as $error) {
                $violations[] = [
                    'propertyPath' => $error->getPropertyPath(),
                    'message'      => $error->getMessage(),
                ];
            }

            return new JsonResponse([
                '@context' => '/api/contexts/ConstraintViolation',
                '@type' => 'ConstraintViolation',
                'hydra:title' => 'An error occurred',
                'violations' => $violations
            ], 422);
        }


        $hashedPassword = $passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);
        $user->setRoles(['ROLE_USER']);

        try {
            $em->persist($user);
            $em->flush();

            return new JsonResponse(['success' => true], 201);
        } catch (UniqueConstraintViolationException $e) {
            return new JsonResponse([
                'success' => false,
                'violations' => [
                    [
                        'propertyPath' => 'email',
                        'message'      => 'Cet email est déjà utilisé.'
                    ]
                ]
            ], 422);
        }
    }
}
